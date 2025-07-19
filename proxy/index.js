import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { OpenAI } from "openai";

const app = express();
const port = process.env.PORT || 3000;

// ✅ CORS para GitHub Pages com OPTIONS
app.use(
  cors({
    origin: "https://maxcoelhogit.github.io",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

// ✅ Middleware extra para OPTIONS
app.options("*", cors());

app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.GPT_KEY,
});

const assistant_id = process.env.GPT_ASSISTANT_ID;

app.post("/ask", async (req, res) => {
  try {
    const { mensagem, thread_id } = req.body;

    let threadId = thread_id;
    if (!threadId) {
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
    }

    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: mensagem,
    });

    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistant_id,
    });

    let status = "queued";
    let resposta = "Sem resposta.";

    while (status !== "completed" && status !== "failed") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const updatedRun = await openai.beta.threads.runs.retrieve(threadId, run.id);
      status = updatedRun.status;
    }

    if (status === "completed") {
      const messages = await openai.beta.threads.messages.list(threadId);
      const ultimaMensagem = messages.data.find((msg) => msg.role === "assistant");
      resposta = ultimaMensagem?.content[0]?.text?.value || "Sem resposta.";
    }

    res.json({ resposta, thread_id: threadId });
  } catch (error) {
    console.error("Erro ao gerar resposta:", error);
    res.status(500).json({ erro: "Erro no servidor" });
  }
});

app.listen(port, () => {
  console.log(`Servidor iniciado na porta ${port}`);
});
