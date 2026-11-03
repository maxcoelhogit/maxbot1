export const MAXBOT_WHATSAPP_SIGNATURE = '🤖 MaxBot | Agente Virtual do Edifício Monções';
export function identifyAutomatedWhatsAppMessage(text) {
  const value = typeof text === 'string' ? text.trim() : '';
  if (!value) return '';
  const escaped = MAXBOT_WHATSAPP_SIGNATURE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const clean = value.replace(new RegExp(`^(?:${escaped}\\s*)+`, 'u'), '').trim();
  return MAXBOT_WHATSAPP_SIGNATURE + '\n\n' + clean;
}
