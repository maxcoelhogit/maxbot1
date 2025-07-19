export default async function handler(req, res) {
  // CORS headers para permitir requisições do GitHub Pages
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight request (CORS)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Somente POST é aceito
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { mensagem, thread_id } = req.body;

  if (!mensagem) {
    return res.status(400).json({ error: "Mensagem não fornecida" });
  }

  try {
    // Etapa 1: Criar mensagem no thread (cria nova se não existir)
    let threadId = thread_id;

    if (!threadId) {
      const threadResponse = await fetch("https://api.openai.com/v1/threads", {
        method: "POST",
        headers: {
          "Authorization": "Bearer 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",
          "OpenAI-Beta": "assistants=v2",
          "Content-Type": "application/json"
        }
      });

      const threadData = await threadResponse.json();
      threadId = threadData.id;
    }

    // Etapa 2: Enviar mensagem para o thread
    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": "Bearer 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",
        "OpenAI-Beta": "assistants=v2",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        role: "user",
        content: mensagem
      })
    });

    // Etapa 3: Executar o assistente
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: "POST",
      headers: {
        "Authorization": "Bearer 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",
        "OpenAI-Beta": "assistants=v2",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        assistant_id: "asst_dk7R5Q7jPZSSB1imMz2NtfTY"
      })
    });

    const runData = await runResponse.json();

    // Etapa 4: Esperar finalização do run
    let status = "queued";
    let respostaFinal = "";

    while (status !== "completed") {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runData.id}`, {
        headers: {
          "Authorization": "Bearer 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",
          "OpenAI-Beta": "assistants=v2"
        }
      });

      const statusData = await statusResponse.json();
      status = statusData.status;
    }

    // Etapa 5: Obter a resposta final
    const mensagensResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        "Authorization": "Bearer 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",
        "OpenAI-Beta": "assistants=v2"
      }
    });

    const mensagensData = await mensagensResponse.json();
    const ultimaMensagem = mensagensData.data.find(msg => msg.role === "assistant");

    if (!ultimaMensagem) {
      return res.status(500).json({ resposta: "Sem resposta gerada." });
    }

    return res.status(200).json({
      resposta: ultimaMensagem.content[0].text.value,
      thread_id: threadId
    });

  } catch (erro) {
    console.error("Erro geral:", erro);
    return res.status(500).json({ error: "Erro interno ao processar a requisição." });
  }
}
