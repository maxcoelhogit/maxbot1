export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // ou especifique seu domínio exato
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end(); // Responde à preflight request
    return;
  }

  try {
    const { mensagem, thread_id } = req.body;

    const resposta = await fetch("https://api.openai.com/v1/threads/" + thread_id + "/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer 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",
        "OpenAI-Beta": "assistants=v2"
      },
      body: JSON.stringify({
        role: "user",
        content: mensagem
      })
    });

    const resultado = await resposta.json();
    res.status(200).json({ resposta: resultado });
  } catch (erro) {
    console.error("Erro ao se comunicar com OpenAI:", erro);
    res.status(500).json({ erro: "Erro ao se comunicar com o servidor." });
  }
}
