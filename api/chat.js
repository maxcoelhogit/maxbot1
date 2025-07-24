export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { mensagem } = req.body;
    console.log("📥 Mensagem recebida:", mensagem);

    const openaiKey = process.env.OPENAI_API_KEY;

    const contextoBase = `
Você é o MaxBot, assistente oficial do Condomínio Edifício Monções.

Fale como se estivesse no WhatsApp: com empatia, clareza, bom humor e praticidade.

Seu papel é:
- Ajudar moradores com dúvidas sobre regras, documentos e procedimentos internos do condomínio.
- Usar as informações abaixo para responder com precisão.
- Em caso de urgência, oriente o morador a contatar o síndico Maxwell no WhatsApp: (12) 97814-0592.
- Quando o morador disser apenas "oi", "bom dia", "olá", etc., responda com:
"Oi! 😊 Como posso te ajudar hoje? Pode me perguntar sobre regras do condomínio, documentos, reclamações, e mais!"

Regras:
- A convenção e regulamento do condomínio estão em vigor desde 2013.
- Câmeras não oferecem gravação a condôminos diretamente, por LGPD. Pedidos devem ser feitos via formulário.

Contatos úteis:
- Monitoramento e câmeras: Remote Security – (12) 3426-8859
- Administração (boletos): Axia – (12) 99131-3909
- Elétrica: Edson Monteiro (Edinho) – (12) 99141-0829

Formulário de solicitações: https://forms.gle/brE9XWSDsbP1U2dW6

Evite dizer que não sabe algo. Quando necessário, oriente o morador a preencher o formulário ou falar com o síndico.
    `;

    const resposta = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: contextoBase },
          { role: "user", content: mensagem }
        ]
      })
    });

    const respostaData = await resposta.json();
    const respostaFinal = respostaData.choices?.[0]?.message?.content || "Sem resposta.";

    console.log("✅ Resposta final:", respostaFinal);

    res.status(200).json({ resposta: respostaFinal });

  } catch (erro) {
    console.error("❌ Erro no backend:", erro);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
}
