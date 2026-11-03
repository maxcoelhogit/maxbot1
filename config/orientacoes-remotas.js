import { MONCOES_LOCAL_GUIDANCE } from './orientacoes-local.js';

// A Administração edita este Google Doc. O acesso público é SOMENTE leitura;
// sem permissão de leitura pública, o backend usa uma cópia segura no repositório.
export const MONCOES_GUIDANCE_DOCUMENT =
  'https://docs.google.com/document/d/10S9TnSmgeQklvG4ugHzdPVmvQQKBM-qnrIfPQ8xRoao/edit';

const EXPORT_URL =
  'https://docs.google.com/document/d/10S9TnSmgeQklvG4ugHzdPVmvQQKBM-qnrIfPQ8xRoao/export?format=txt';
const CACHE_MS = 5 * 60 * 1000;
const MAX_CHARS = 14000;
let cached = { until: 0, text: MONCOES_LOCAL_GUIDANCE };

export async function getOperationalGuidance({
  fetcher = globalThis.fetch, forceReload = false
} = {}) {
  if (!forceReload && Date.now() < cached.until) return cached.text;
  let text = MONCOES_LOCAL_GUIDANCE;
  try {
    const response = await fetcher(EXPORT_URL, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(2400)
    });
    if (!response.ok) throw new Error('documento inacessível');
    const length = Number(response.headers?.get?.('content-length') || 0);
    if (length > MAX_CHARS * 4) throw new Error('documento excede tamanho');
    const remote = await response.text();
    const clean = remote.replace(/^\uFEFF/, '').trim();
    if (clean.startsWith('MAXBOT_ORIENTACOES_V1') &&
        clean.length >= 100 && clean.length <= MAX_CHARS &&
        !/<html|<!doctype/i.test(clean)) {
      text = clean;
    }
  } catch {
    // Documento privado, indisponível ou inválido: preservar informações locais.
  }
  cached = { until: Date.now() + CACHE_MS, text };
  return text;
}
