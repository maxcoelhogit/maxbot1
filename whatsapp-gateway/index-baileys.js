import express from "express";
import QRCode from "qrcode";
import makeWASocket, {
  Browsers,
  DisconnectReason,
  useMultiFileAuthState
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import P from "pino";
import fs from "fs";
import path from "path";

const PORT = Number(process.env.PORT || 3000);
const MAXBOT_API_URL = process.env.MAXBOT_API_URL || "https://maxbot-gamma.vercel.app/api/chat";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const AUTH_PATH = process.env.BAILEYS_AUTH_PATH || "/data/baileys-auth";
const STATE_PATH = process.env.BAILEYS_STATE_PATH || "/data/state-baileys.json";
const HUMAN_PAUSE_MINUTES = Number(process.env.HUMAN_PAUSE_MINUTES || 30);

const logger = P({ level: process.env.BAILEYS_LOG_LEVEL || "silent" });
const app = express();
app.use(express.json());

let sock = null;
let latestQr = null;
let whatsappReady = false;
let authenticated = false;
let selfId = null;
let reconnectTimer = null;
let openedAt = 0;

const pendingBotSends = new Map();
const state = loadState();
if (!state.chats) state.chats = {};
if (!state.threads) state.threads = {};
if (!Array.isArray(state.processedMessageIds)) state.processedMessageIds = [];

function loadState() {
  try {
    if (fs.existsSync(STATE_PATH)) {
      return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
    }
  } catch (err) {
    console.error("Falha ao carregar estado:", err);
  }
  return { chats: {}, threads: {}, processedMessageIds: [] };
}

function saveState() {
  try {
    fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error("Falha ao salvar estado:", err);
  }
}

function requireAdmin(req, res, next) {
  if (!ADMIN_TOKEN) return res.status(503).send("ADMIN_TOKEN não configurado.");
  const token = req.query.token || req.headers["x-admin-token"];
  if (token !== ADMIN_TOKEN) return res.status(401).send("Não autorizado.");
  next();
}

function getChatMode(chatId) {
  const chat = state.chats[chatId] || {};
  if ((chat.pausedUntil || 0) > Date.now()) return "human";
  return chat.mode || "bot";
}

function setChatMode(chatId, mode, pausedUntil = 0) {
  state.chats[chatId] = { mode, pausedUntil };
  saveState();
}

function pauseForHuman(chatId) {
  setChatMode(
    chatId,
    "human",
    Date.now() + HUMAN_PAUSE_MINUTES * 60 * 1000
  );
}

function messageTimestamp(message) {
  const ts = message?.messageTimestamp;
  if (typeof ts === "number") return ts;
  if (typeof ts === "bigint") return Number(ts);
  if (ts && typeof ts.toNumber === "function") return ts.toNumber();
  return Number(ts || 0);
}

function messageKey(message) {
  return (
    message?.key?.id ||
    [
      message?.key?.remoteJid,
      message?.key?.fromMe,
      messageTimestamp(message),
      extractText(message?.message)
    ].join("|")
  );
}

function wasProcessed(message) {
  return state.processedMessageIds.includes(messageKey(message));
}

function markProcessed(message) {
  const key = messageKey(message);
  if (!state.processedMessageIds.includes(key)) {
    state.processedMessageIds.push(key);
    if (state.processedMessageIds.length > 800) {
      state.processedMessageIds = state.processedMessageIds.slice(-800);
    }
    saveState();
  }
}

function unwrapContent(content) {
  if (!content) return null;
  if (content.ephemeralMessage?.message) return unwrapContent(content.ephemeralMessage.message);
  if (content.viewOnceMessage?.message) return unwrapContent(content.viewOnceMessage.message);
  if (content.viewOnceMessageV2?.message) return unwrapContent(content.viewOnceMessageV2.message);
  if (content.documentWithCaptionMessage?.message) return unwrapContent(content.documentWithCaptionMessage.message);
  return content;
}

function extractText(content) {
  const c = unwrapContent(content);
  if (!c) return "";
  return (
    c.conversation ||
    c.extendedTextMessage?.text ||
    c.imageMessage?.caption ||
    c.videoMessage?.caption ||
    c.documentMessage?.caption ||
    ""
  ).trim();
}

async function callMaxBot(chatId, text) {
  const resp = await fetch(MAXBOT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mensagem: text,
      thread_id: state.threads[chatId] || null
    })
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    throw new Error(data?.erro || `MaxBot respondeu HTTP ${resp.status}`);
  }

  if (data.thread_id) {
    state.threads[chatId] = data.thread_id;
    saveState();
  }

  return (data.resposta || "").trim();
}

function isIgnoredJid(jid) {
  return (
    !jid ||
    jid === "status@broadcast" ||
    jid.endsWith("@g.us") ||
    jid.endsWith("@newsletter") ||
    jid.includes("@broadcast")
  );
}

async function handleMessage(message, upsertType) {
  try {
    const jid = message?.key?.remoteJid;
    if (isIgnoredJid(jid)) return;

    const body = extractText(message.message);
    if (!body) return;

    const ts = messageTimestamp(message);
    if (openedAt && ts && ts < openedAt - 120) {
      return;
    }

    if (wasProcessed(message)) return;

    if (message.key.fromMe) {
      const pending = pendingBotSends.get(jid);

      if (
        pending &&
        pending.body === body &&
        Date.now() - pending.createdAt < 30000
      ) {
        pendingBotSends.delete(jid);
        markProcessed(message);
        console.log("Eco da resposta do MaxBot reconhecido:", jid);
        return;
      }

      markProcessed(message);

      if (body.toLowerCase() === "#bot on") {
        setChatMode(jid, "bot", 0);
        console.log("Bot ativado manualmente:", jid);
        return;
      }

      if (body.toLowerCase() === "#bot off") {
        setChatMode(jid, "human", Number.MAX_SAFE_INTEGER);
        console.log("Bot desativado manualmente:", jid);
        return;
      }

      pauseForHuman(jid);
      console.log(`Atendimento humano detectado em ${jid}; bot pausado por ${HUMAN_PAUSE_MINUTES} min.`);
      return;
    }

    markProcessed(message);

    if (getChatMode(jid) !== "bot") {
      console.log("Mensagem recebida, mas conversa está em modo humano:", jid);
      return;
    }

    console.log("Mensagem recebida via Baileys:", {
      jid,
      type: upsertType,
      id: message.key.id
    });

    const answer = await callMaxBot(jid, body);
    if (!answer) {
      console.warn("MaxBot retornou resposta vazia:", jid);
      return;
    }

    pendingBotSends.set(jid, {
      body: answer,
      createdAt: Date.now()
    });

    await sock.sendMessage(jid, { text: answer });
    console.log("Resposta do MaxBot enviada via Baileys:", jid);

    setTimeout(() => {
      const pending = pendingBotSends.get(jid);
      if (pending && Date.now() - pending.createdAt >= 30000) {
        pendingBotSends.delete(jid);
      }
    }, 31000);
  } catch (err) {
    console.error("Erro ao processar mensagem Baileys:", err);
  }
}

async function connectWhatsApp() {
  fs.mkdirSync(AUTH_PATH, { recursive: true });

  const { state: authState, saveCreds } = await useMultiFileAuthState(AUTH_PATH);

  sock = makeWASocket({
    auth: authState,
    logger,
    browser: Browsers.ubuntu("Chrome"),
    markOnlineOnConnect: false,
    syncFullHistory: false,
    emitOwnEvents: true
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      latestQr = qr;
      whatsappReady = false;
      authenticated = false;
      console.log("Novo QR Baileys disponível em /qr.");
    }

    if (connection === "open") {
      latestQr = null;
      whatsappReady = true;
      authenticated = true;
      openedAt = Math.floor(Date.now() / 1000);
      selfId = sock?.user?.id || null;
      console.log("WhatsApp Baileys pronto.", selfId || "");
    }

    if (connection === "close") {
      whatsappReady = false;
      authenticated = false;

      const statusCode =
        lastDisconnect?.error instanceof Boom
          ? lastDisconnect.error.output?.statusCode
          : lastDisconnect?.error?.output?.statusCode;

      console.error("Conexão Baileys fechada.", statusCode || "");

      if (statusCode !== DisconnectReason.loggedOut) {
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          connectWhatsApp().catch((err) =>
            console.error("Falha ao reconectar Baileys:", err)
          );
        }, 2500);
      } else {
        console.error("Sessão Baileys desconectada pelo WhatsApp; novo QR necessário.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    console.log(`Baileys messages.upsert: ${messages.length} mensagem(ns), tipo ${type}`);
    for (const message of messages) {
      await handleMessage(message, type);
    }
  });
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    transport: "baileys",
    whatsappReady,
    authenticated,
    qrPending: Boolean(latestQr)
  });
});

app.get("/status", requireAdmin, (_req, res) => {
  res.json({
    transport: "baileys",
    whatsappReady,
    authenticated,
    qrPending: Boolean(latestQr),
    selfId,
    humanPauseMinutes: HUMAN_PAUSE_MINUTES,
    maxBotApi: MAXBOT_API_URL
  });
});

app.get("/qr", requireAdmin, async (_req, res) => {
  if (whatsappReady) {
    return res.type("html").send("<h2>WhatsApp já está conectado ao MaxBot via Baileys.</h2>");
  }

  if (!latestQr) {
    return res.type("html").send("<h2>Aguardando novo QR Code. Atualize esta página em alguns segundos.</h2>");
  }

  const image = await QRCode.toDataURL(latestQr, { width: 420, margin: 2 });

  res.type("html").send(`
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>MaxBot — Vincular WhatsApp</title>
        <style>
          body{font-family:system-ui,-apple-system,sans-serif;background:#f6f7f8;margin:0;padding:32px;text-align:center}
          .card{max-width:560px;margin:auto;background:#fff;border-radius:16px;padding:28px;box-shadow:0 8px 30px rgba(0,0,0,.08)}
          img{max-width:100%;height:auto}
          p{color:#444;line-height:1.5}
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Vincular MaxBot ao WhatsApp</h1>
          <p>WhatsApp Business → Dispositivos conectados → Conectar um dispositivo.</p>
          <img src="${image}" alt="QR Code do WhatsApp">
          <p>Esta nova sessão usa Baileys e substitui o transporte anterior baseado em Chromium.</p>
        </div>
      </body>
    </html>
  `);
});

app.get("/", (_req, res) => {
  res.type("text").send("MaxBot WhatsApp Gateway — Baileys");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Gateway Baileys ouvindo na porta ${PORT}`);
});

connectWhatsApp().catch((err) => {
  console.error("Falha ao inicializar Baileys:", err);
  process.exitCode = 1;
});
