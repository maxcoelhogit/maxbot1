import { MAXBOT_SYSTEM_PROMPT } from "../config/maxbot.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ erro: "Método não permitido" });

  try {
    const { mensagem, thread_id: previousResponseId } = req.body || {};

    if (!mensagem || !mensagem.trim()) {
      return res.status(400).json({ erro: "Mensagem ausente" });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return res.status(500).json({ erro: "OPENAI_API_KEY não configurada no servidor" });
    }

    const payload = {
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      instructions: MAXBOT_SYSTEM_PROMPT,
      input: mensagem.trim(),
      store: true
    };

    if (previousResponseId) {
      payload.previous_response_id = previousResponseId;
    }

    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      console.error("Erro OpenAI:", data);
      return res.status(openaiRes.status).json({
        erro: data?.error?.message || "Erro ao gerar resposta"
      });
    }

    const resposta =
      data.output_text ||
      data.output
        ?.flatMap(item => item.content || [])
        ?.find(content => content.type === "output_text")
        ?.text ||
      "Sem resposta.";

    return res.status(200).json({
      resposta: resposta.trim(),
      thread_id: data.id
    });
  } catch (erro) {
    console.error("Erro no backend:", erro);
    return res.status(500).json({ erro: "Erro interno no servidor" });
  }
}
