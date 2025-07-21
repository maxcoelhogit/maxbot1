export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { mensagem, thread_id: recebidoThreadId } = req.body;
    console.log("📥 Mensagem recebida:", mensagem);
    console.log("📎 Thread ID recebido:", recebidoThreadId);

    const openaiKey = process.env.OPENAI_API_KEY;
    const assistantId = "asst_dk7R5Q7jPZSSB1imMz2NtfTY"; // ID fixo do MaxBot

    let threadId = recebidoThreadId;

    // Se não houver thread_id, cria uma nova thread
    if (!threadId) {
      const novaThread = await fetch("https://api.openai.com/v1/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`,
          "OpenAI-Beta": "assistants=v2"
        }
      });

      const novaThreadData = await novaThread.json();
      threadId = novaThreadData.id;
      console.log("🧵 Nova thread criada:", threadId);
    }

    // Adiciona a mensagem à thread
    const mensagemRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
        "OpenAI-Beta": "assistants=v2"
      },
      body: JSON.stringify({
        role: "user",
        content: mensagem
      })
    });

    const mensagemData = await mensagemRes.json();
    console.log("📤 Mensagem adicionada:", mensagemData);

    // Cria a execução (run)
    const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
        "OpenAI-Beta": "assistants=v2"
      },
      body: JSON.stringify({
        assistant_id: assistantId
      })
    });

    const runData = await runRes.json();
    const runId = runData.id;

    console.log("🏃 Run iniciada:", runId);

    // Aguarda a execução finalizar
    let status = runData.status;
    let attempts = 0;
    while (status !== "completed" && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "OpenAI-Beta": "assistants=v2"
        }
      });

      const statusData = await statusRes.json();
      status = statusData.status;
      attempts++;
    }

    // Busca a resposta final
    const respostaRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "OpenAI-Beta": "assistants=v2"
      }
    });

    const respostaData = await respostaRes.json();
    const ultima = respostaData.data?.find(m => m.role === "assistant");
    const resposta = ultima?.content?.[0]?.text?.value || "Sem resposta.";

    // 🔧 Corrige escapes \[ \] \( \)
    const respostaCorrigida = resposta.replace(/\\([\[\]\(\)])/g, "$1");

    console.log("✅ Resposta final:", respostaCorrigida);

    res.status(200).json({ resposta: respostaCorrigida, thread_id: threadId });

  } catch (erro) {
    console.error("❌ Erro no backend:", erro);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
}
