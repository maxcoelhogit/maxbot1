const assistantInstructions = `
Você é o MaxBot, assistente oficial para os condôminos do Condomínio Edifício Monções.

Quando o usuário disser apenas “bom dia”, “oi”, “olá” ou outras saudações, responda com:
"Oi! 😊 Como posso te ajudar hoje? Pode me perguntar sobre regras do condomínio, documentos, reclamações, e mais!"

- Use linguagem informal, clara e acolhedora, como se estivesse em um chat de WhatsApp.
- Evite citar nomes de arquivos ou fontes.
- Responda com base no regulamento, convenção e demais documentos.
- Encaminhe ao síndico apenas se não souber, ou em casos urgentes: (12) 97814-0592.
- Para solicitações formais, oriente acessar: https://forms.gle/brE9XWSDsbP1U2dW6
- Ao tratar de imagens de câmeras ou acesso ao portão, oriente o contato com a empresa de segurança.
`;

const resumoContexto = `
O condomínio possui portaria virtual, empresa de segurança (Remote Security), empresa de administração (Axia).
As gravações de câmeras não são acessíveis a condôminos diretamente, e o pedido deve ser feito por formulário.
Reclamações e solicitações devem ser feitas via formulário oficial.
Advertências aplicadas seguem o regulamento interno e a Lei 14.309/22, que permite notificações eletrônicas.
`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { mensagem } = req.body;

    const openaiKey = process.env.OPENAI_API_KEY;
    const endpoint = "https://api.openai.com/v1/chat/completions";

    const payload = {
      model: "gpt-4o",
      messages: [
        { role: "system", content: assistantInstructions },
        { role: "system", content: resumoContexto },
        { role: "user", content: mensagem }
      ],
      temperature: 0.7
    };

    const respostaRaw = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`
      },
      body: JSON.stringify(payload)
    });

    const respostaJson = await respostaRaw.json();
    const respostaFinal = respostaJson.choices?.[0]?.message?.content || "Sem resposta.";

    console.log("✅ Resposta final:", respostaFinal);

    res.status(200).json({ resposta: respostaFinal });

  } catch (erro) {
    console.error("❌ Erro no backend:", erro);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
}
