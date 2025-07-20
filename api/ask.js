export default async function handler(req, res) {
  try {
    const { mensagem, thread_id } = req.body;

    if (!mensagem) {
      return res.status(400).json({ erro: "Mensagem não fornecida." });
    }

    const resposta = await fetch("https://api.openai.com/v1/threads/runs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2"
      },
      body: JSON.stringify({
        assistant_id: process.env.OPENAI_ASSISTANT_ID,
        thread_id: thread_id || null,
        instructions: mensagem
      })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      return res.status(200).json({ resposta: dados, thread_id });
    } else {
      return res.status(500).json({ erro: dados.error || "Erro desconhecido da OpenAI" });
    }

  } catch (erro) {
    console.error("Erro interno:", erro);
    return res.status(500).json({ erro: "Erro interno do servidor." });
  }
}
