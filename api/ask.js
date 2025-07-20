export default async function handler(req, res) {
  // 🔒 CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*"); // Ou restrinja para seu domínio
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ⚠️ Trata a requisição OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { mensagem, thread_id } = req.body;

    // Mock temporário para teste
    const resposta = {
      texto: `Você disse: ${mensagem}`,
      thread_id: thread_id || "novo_thread_id"
    };

    return res.status(200).json({
      resposta: resposta.texto,
      thread_id: resposta.thread_id
    });

  } catch (error) {
    console.error("Erro interno:", error);
    return res.status(500).json({ error: "Erro interno" });
  }
}
