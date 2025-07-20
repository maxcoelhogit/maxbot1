export default async function handler(req, res) {
  // Configurações de CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Requisição preflight (CORS)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Validação do método
  if (req.method !== "POST") {
    return res.status(405).json({ erro: "Método não permitido" });
  }

  try {
    const { mensagem, thread_id } = req.body;

    // Envia mensagem para o Assistant
    const resposta = await fetch(`https://api.openai.com/v1/threads/${thread_id || ""}/messages`, {
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

    const dados = await resposta.json();

    // Se não havia thread, cria uma nova com a resposta
    const novoThreadId = thread_id || dados.thread_id || null;

    return res.status(200).json({
      resposta: dados.choices ? dados.choices[0].message.content : "Sem resposta",
      thread_id: novoThreadId
    });

  } catch (erro) {
    console.error("Erro ao enviar pergunta:", erro);
    return res.status(500).json({ erro: "Erro ao se conectar à OpenAI." });
  }
}
