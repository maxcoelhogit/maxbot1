export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end(); // Preflight CORS
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { pergunta } = req.body;
  if (!pergunta) {
    return res.status(400).json({ error: "Pergunta não fornecida." });
  }

  try {
    const resposta = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        "Authorization": "Bearer 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",
        "OpenAI-Beta": "assistants=v2",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        assistant_id: "asst_dk7R5Q7jPZSSB1imMz2NtfTY",
        instructions: pergunta
      })
    });

    const data = await resposta.json();
    return res.status(200).json({ resposta: data });
  } catch (erro) {
    console.error("Erro ao chamar API OpenAI:", erro);
    return res.status(500).json({ error: "Erro ao chamar API OpenAI" });
  }
}
