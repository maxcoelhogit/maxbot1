export default async function handler(req, res) {
  // CORS fix universal
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, OpenAI-Beta");

  if (req.method === "OPTIONS") {
    return res.status(200).end(); // Responde ao preflight
  }

  try {
    const { mensagem, thread_id } = req.body;

    const resposta = await fetch("https://api.openai.com/v1/threads/" + (thread_id || "your-thread-id") + "/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2"
      },
      body: JSON.stringify({
        role: "user",
        content: mensagem
      })
    });

    const data = await resposta.json();
    res.status(200).json(data);

  } catch (error) {
    console.error("Erro na API:", error);
    res.status(500).json({ erro: "Erro interno no servidor." });
  }
}
