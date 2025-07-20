export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "https://maxcoelhogit.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Pré-verificação (preflight)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { mensagem, thread_id } = req.body;

    // Exemplo de chamada (adicione sua chamada real à OpenAI aqui)
    const resposta = {
      texto: `Você disse: ${mensagem}`,
      thread_id: thread_id || "novo_thread_id"
    };

    return res.status(200).json({ resposta: resposta.texto, thread_id: resposta.thread_id });

  } catch (erro) {
    console.error("Erro:", erro);
    return res.status(500).json({ erro: "Erro interno." });
  }
}
