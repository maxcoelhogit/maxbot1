import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const GPT_KEY = process.env.GPT_KEY;
const GPT_ASSISTANT_ID = process.env.GPT_ASSISTANT_ID;

app.get("/", (req, res) => {
  res.send("Proxy do MaxBot está no ar!");
});

app.post("/ask", async (req, res) => {
  const { mensagem, thread_id } = req.body;

  if (!mensagem || !GPT_KEY || !GPT_ASSISTANT_ID) {
    return res.status(400).json({ erro: "Requisição inválida." });
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${GPT_KEY}`,
    "OpenAI-Beta": "assistants=v2",
  };

  try {
    // Cria nova thread se não houver
    let threadId = thread_id;
    if (!threadId) {
      const novaThread = await fetch("https://api.openai.com/v1/threads", {
        method: "POST",
        headers,
      });
      const novaThreadData = await novaThread.json();
      threadId = novaThreadData.id;
      console.log("Nova thread criada:", threadId);
    }

    // Envia mensagem
    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        role: "user",
        content: mensagem,
      }),
    });

    // Executa o assistente
    const runResponse = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          assistant_id: GPT_ASSISTANT_ID,
        }),
      }
    );
    const run = await runResponse.json();
    console.log("Run iniciado:", run.id);

    // Aguarda o run finalizar (polling com segurança)
    let status = "queued";
    let tentativas = 0;
    let runStatusData;

    while (status !== "completed" && status !== "failed" && tentativas < 15) {
      await new Promise((r) => setTimeout(r, 2000)); // espera 2s
      const statusRes = await fetch(
        `https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`,
        { headers }
      );
      runStatusData = await statusRes.json();
      status = runStatusData.status;
      tentativas++;
      console.log(`Tentativa ${tentativas}: status = ${status}`);
    }

    if (status !== "completed") {
      console.error("Run não completado a tempo:", runStatusData);
      return res
        .status(500)
        .json({ erro: "Assistente não respondeu a tempo." });
    }

    // Busca a resposta
    const msgRes = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      { headers }
    );
    const msgData = await msgRes.json();
    console.log("Mensagens recebidas:", msgData);

    const mensagens = msgData.data || [];
    const ultima = mensagens.find((m) => m.role === "assistant");

    res.json({
      resposta: ultima ? ultima.content[0].text.value : "Sem resposta.",
      thread_id: threadId,
    });
  } catch (erro) {
    console.error("Erro no proxy:", erro);
    res.status(500).json({ erro: "Erro ao processar mensagem." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
