export const MAXBOT_WHATSAPP_SIGNATURE = '🔹 MaxBot | Assistente virtual do Edifício Monções';
const PREVIOUS_SIGNATURE = '🤖 MaxBot | Agente Virtual do Edifício Monções';

export function identifyAutomatedWhatsAppMessage(text) {
  let body = typeof text === 'string' ? text.trim() : '';
  if (!body) return '';
  // Evita múltiplas assinaturas mesmo em respostas encaminhadas/duplicadas.
  for (let i = 0; i < 5; i += 1) {
    const prefix = [MAXBOT_WHATSAPP_SIGNATURE, PREVIOUS_SIGNATURE]
      .find(signature => body.startsWith(signature));
    if (!prefix) break;
    body = body.slice(prefix.length).trimStart();
  }
  return MAXBOT_WHATSAPP_SIGNATURE + '\n\n' + body;
}
