export default async function handler(req, res) {
  // Habilita CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Responde às requisições OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  try {
    const { mensagem, thread_id } = req.body;

    const resposta = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GPT_KEY}`,
        "OpenAI-Beta": "assistants=v2",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: mensagem }],
        assistant_id: process.env.GPT_ASSISTANT_ID,
        ...(thread_id ? { thread_id } : {})
      })
    });

    const data = await resposta.json();

    return res.status(200).json({
      resposta: data?.choices?.[0]?.message?.content || "Sem resposta.",
      thread_id: data?.thread_id || thread_id || null
    });

  } catch (erro) {
    console.error("Erro no proxy:", erro);
    return res.status(500).json({ erro: "Erro ao consultar assistente." });
  }
}
