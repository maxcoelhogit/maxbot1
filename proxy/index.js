export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  const { mensagem, thread_id } = req.body;
  const API_KEY = process.env.GPT_KEY;
  const ASSISTANT_ID = process.env.GPT_ASSISTANT_ID;
  const headers = {
    "Authorization": `Bearer ${API_KEY}`,
    "OpenAI-Beta": "assistants=v2",
    "Content-Type": "application/json"
  };

  try {
    // Cria novo thread se não existir
    const threadId = thread_id || (await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers
    }).then(res => res.json())).id;

    // Adiciona mensagem do usuário ao thread
    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        role: "user",
        content: mensagem
      })
    });

    // Inicia o run com o assistente
    const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ assistant_id: ASSISTANT_ID })
    });
    const run = await runRes.json();

    // Aguarda o run finalizar (polling)
    let status = "queued";
    while (status !== "completed" && status !== "failed") {
      await new Promise(r => setTimeout(r, 1500)); // espera 1.5s
      const statusRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`, { headers });
      status = (await statusRes.json()).status;
    }

    // Recupera mensagens
    const msgRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, { headers });
    const msgData = await msgRes.json();
    const resposta = msgData.data?.[0]?.content?.[0]?.text?.value || "Sem resposta.";

    return res.status(200).json({ resposta, thread_id: threadId });

  } catch (erro) {
    console.error("Erro no proxy:", erro);
    return res.status(500).json({ erro: "Erro ao consultar assistente." });
  }
}
