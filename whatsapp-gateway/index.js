import express from "express";
import QRCode from "qrcode";
import pkg from "whatsapp-web.js";
import fs from "fs";
import path from "path";

const { Client, LocalAuth } = pkg;

const PORT = Number(process.env.PORT || 3000);
const MAXBOT_API_URL = process.env.MAXBOT_API_URL || "https://maxbot-gamma.vercel.app/api/chat";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const AUTH_PATH = process.env.WHATSAPP_AUTH_PATH || "/data/auth";
const STATE_PATH = process.env.STATE_PATH || "/data/state.json";
const HUMAN_PAUSE_MINUTES = Number(process.env.HUMAN_PAUSE_MINUTES || 30);

const app = express();
app.use(express.json());

let latestQr = null;
let whatsappReady = false;
let authenticated = false;
let selfId = null;

// Rastreia mensagens enviadas pelo próprio MaxBot para que o evento
// message_create não as confunda com atendimento humano.
const pendingBotSends = new Map();

const state = loadState();

// Migração única: limpa pausas temporárias que podem ter sido criadas
// pela versão anterior ao confundir respostas do bot com atendimento humano.
if (!state.handoffFixApplied) {
  for (const [chatId, chat] of Object.entries(state.chats || {})) {
    if (chat?.mode === "human" && Number.isFinite(chat?.pausedUntil) && chat.pausedUntil > 0) {
      state.chats[chatId] = { mode: "bot", pausedUntil: 0 };
    }
  }
  state.handoffFixApplied = true;
  saveState();
}

function clearStaleChromiumLocks(root) {
  try {
    if (!fs.existsSync(root)) return;
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      const full = path.join(root, entry.name);
      if (entry.isDirectory()) {
        clearStaleChromiumLocks(full);
      } else if (/^Singleton(Lock|Socket|Cookie)$/.test(entry.name)) {
        try {
          fs.unlinkSync(full);
          console.log("Lock antigo do Chromium removido:", full);
        } catch (err) {
          console.warn("Não foi possível remover lock do Chromium:", full, err.message);
        }
      }
    }
  } catch (err) {
    console.warn("Falha ao verificar locks do Chromium:", err.message);
  }
}

clearStaleChromiumLocks(AUTH_PATH);

function loadState() {
  try {
    if (fs.existsSync(STATE_PATH)) {
      return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
    }
  } catch (err) {
    console.error("Falha ao carregar estado:", err);
  }
  return { chats: {}, threads: {} };
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
  const pausedUntil = chat.pausedUntil || 0;
  if (pausedUntil > Date.now()) return "human";
  return chat.mode || "bot";
}

function setChatMode(chatId, mode, pausedUntil = 0) {
  state.chats[chatId] = { mode, pausedUntil };
  saveState();
}

function pauseForHuman(chatId) {
  const pausedUntil = Date.now() + HUMAN_PAUSE_MINUTES * 60 * 1000;
  setChatMode(chatId, "human", pausedUntil);
}

async function callMaxBot(chatId, text) {
  const body = {
    mensagem: text,
    thread_id: state.threads[chatId] || null
  };

  const resp = await fetch(MAXBOT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    throw new Error(`MaxBot respondeu HTTP ${resp.status}`);
  }

  const data = await resp.json();
  if (data.thread_id) {
    state.threads[chatId] = data.thread_id;
    saveState();
  }
  return data.resposta;
}

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "maxbot-condominio",
    dataPath: AUTH_PATH
  }),
  puppeteer: {
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote"
    ]
  }
});

client.on("qr", (qr) => {
  latestQr = qr;
  whatsappReady = false;
  authenticated = false;
  console.log("QR Code atualizado. Abra /qr com o token administrativo.");
});

client.on("authenticated", () => {
  authenticated = true;
  latestQr = null;
  console.log("WhatsApp autenticado.");
});

client.on("ready", async () => {
  whatsappReady = true;
  latestQr = null;
  selfId = client.info?.wid?._serialized || null;
  console.log("WhatsApp pronto.", selfId || "");
});

client.on("auth_failure", (msg) => {
  authenticated = false;
  whatsappReady = false;
  console.error("Falha de autenticação:", msg);
});

client.on("disconnected", (reason) => {
  whatsappReady = false;
  authenticated = false;
  console.error("WhatsApp desconectado:", reason);
});

async function processIncomingMessage(message) {
  try {
    const chatId = message.from;
    if (!chatId || chatId.endsWith("@g.us") || chatId === "status@broadcast") return;

    const body = (message.body || "").trim();
    console.log("Evento message recebido:", {
      chatId,
      fromMe: Boolean(message.fromMe),
      hasBody: Boolean(body)
    });

    if (!body) return;

    const mode = getChatMode(chatId);
    if (mode !== "bot") {
      console.log("Mensagem ignorada porque conversa está em modo humano:", chatId);
      return;
    }

    console.log("Mensagem recebida de", chatId);
    const answer = await callMaxBot(chatId, body);
    if (!answer) {
      console.warn("MaxBot retornou resposta vazia para", chatId);
      return;
    }

    pendingBotSends.set(chatId, {
      body: answer,
      createdAt: Date.now()
    });

    await client.sendMessage(chatId, answer);
    console.log("Resposta do MaxBot enviada para", chatId);

    setTimeout(() => {
      const pending = pendingBotSends.get(chatId);
      if (pending && Date.now() - pending.createdAt >= 30000) {
        pendingBotSends.delete(chatId);
      }
    }, 31000);
  } catch (err) {
    console.error("Erro ao processar mensagem recebida:", err);
  }
}

// Evento específico para mensagens recebidas de outros usuários.
// A documentação do whatsapp-web.js separa este evento de message_create.
client.on("message", processIncomingMessage);

// message_create fica responsável apenas por mensagens enviadas pela própria conta,
// permitindo diferenciar atendimento humano de respostas automáticas do MaxBot.
client.on("message_create", async (message) => {
  try {
    if (!message.fromMe) return;

    const chatId = message.to;
    if (!chatId || chatId.endsWith("@g.us") || chatId === "status@broadcast") return;

    const body = (message.body || "").trim();
    console.log("Evento message_create próprio:", {
      chatId,
      hasBody: Boolean(body)
    });

    const pending = pendingBotSends.get(chatId);
    if (
      pending &&
      pending.body === body &&
      Date.now() - pending.createdAt < 30000
    ) {
      pendingBotSends.delete(chatId);
      console.log("Mensagem do próprio MaxBot reconhecida em", chatId);
      return;
    }

    if (body.toLowerCase() === "#bot on") {
      setChatMode(chatId, "bot", 0);
      console.log("Bot ativado manualmente em", chatId);
      return;
    }

    if (body.toLowerCase() === "#bot off") {
      setChatMode(chatId, "human", Number.MAX_SAFE_INTEGER);
      console.log("Bot desativado manualmente em", chatId);
      return;
    }

    if (body) {
      pauseForHuman(chatId);
      console.log(`Atendimento humano detectado em ${chatId}; bot pausado por ${HUMAN_PAUSE_MINUTES} min.`);
    }
  } catch (err) {
    console.error("Erro ao processar mensagem enviada pela própria conta:", err);
  }
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    whatsappReady,
    authenticated,
    qrPending: Boolean(latestQr)
  });
});

app.get("/status", requireAdmin, (_req, res) => {
  res.json({
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
    return res.type("html").send("<h2>WhatsApp já está conectado ao MaxBot.</h2>");
  }
  if (!latestQr) {
    return res.type("html").send("<h2>Aguardando geração do QR Code. Atualize esta página em alguns segundos.</h2>");
  }

  const image = await QRCode.toDataURL(latestQr, { width: 420, margin: 2 });
  res.type("html").send(`
    <!doctype html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
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
        <p>No WhatsApp Business do condomínio, abra <b>Dispositivos conectados</b> → <b>Conectar um dispositivo</b> e escaneie o QR Code abaixo.</p>
        <img src="${image}" alt="QR Code do WhatsApp" />
        <p>Depois de escanear, esta página passará a informar que o WhatsApp está conectado.</p>
      </div>
    </body>
    </html>
  `);
});

app.get("/", (_req, res) => {
  res.type("text").send("MaxBot WhatsApp Gateway");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Gateway ouvindo na porta ${PORT}`);
});

client.initialize().catch((err) => {
  console.error("Falha ao inicializar WhatsApp:", err);
  process.exitCode = 1;
});
