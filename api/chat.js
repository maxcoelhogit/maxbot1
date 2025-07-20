export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { mensagem, thread_id } = req.body;
    console.log("📥 Mensagem recebida:", mensagem);
    console.log("📎 Thread ID:", thread_id);

    const respostaOpenAI = await fetch(`https://api.openai.com/v1/threads/${thread_id || "your-thread-id"}/messages`, {
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

    const resultado = await respostaOpenAI.json();
    console.log("📤 Resposta da OpenAI:", resultado);

    res.status(200).json({
      resposta: resultado?.content?.[0]?.text?.value || null,
      thread_id
    });

  } catch (erro) {
    console.error("❌ Erro ao gerar resposta:", erro);
    res.status(500).json({ erro: "Erro ao gerar resposta" });
  }
}
