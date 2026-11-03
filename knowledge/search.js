import { REGULAMENTO_2013 } from './regulamento-2013.js';
import { PUBLIC_PROCEDURES } from './procedures.js';

const STOP = new Set('a o as os de da do das dos em no na nos nas e ou por para que qual quais como com uma um esta este isso aqui pode posso poderia quero preciso minha meu tem fazer ser sobre ainda desde onde quando estão'.split(' '));
const normalize = (text) => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const terms = (text) => [...new Set((normalize(text).match(/[a-z0-9]{3,}/g) || []).filter(x => !STOP.has(x)))];

export function retrievePublicKnowledge(message, limit = 4) {
  const current = String(message || '').split('MENSAGEM ATUAL DO CONTATO\n').pop().slice(0, 2000);
  const words = terms(current);
  if (!words.length) return [];
  const articleMatch = normalize(current).match(/(?:artigo|art)\.?\s*(\d{1,2})\b/);
  return REGULAMENTO_2013.map(entry => {
    const tags = terms(entry.topics);
    const content = terms(entry.text);
    let score = words.reduce((total, word) => total + (tags.includes(word) ? 4 : 0) + (content.includes(word) ? 1 : 0), 0);
    if (articleMatch && Number(articleMatch[1]) === entry.article) score += 20;
    return { entry, score };
  }).filter(x => x.score >= 2).sort((a, b) => b.score - a.score || a.entry.article - b.entry.article).slice(0, Math.max(0, Math.min(5, limit))).map(({entry}) => ({
    document: 'Regulamento Interno — versão de 27/03/2013',
    source: 'https://drive.google.com/file/d/16t32vin4rxbmsxCbmEiORrk1DJ2R5h-c/view',
    article: entry.article,
    section: `Art. ${entry.article}º`,
    effectiveStatus: 'vigência atual pendente de confirmação administrativa',
    access: 'publico',
    excerpt: entry.text
  }));
}

export function retrievePublicProcedures(message, limit = 2) {
  const current = String(message || '').split('MENSAGEM ATUAL DO CONTATO\n').pop().slice(0, 2000);
  const queryTerms = terms(current);
  return PUBLIC_PROCEDURES.map(entry => ({
    entry, score: queryTerms.reduce((sum, word) => sum + (terms(entry.keywords).includes(word) ? 4 : 0), 0)
  })).filter(x => x.score >= 4).sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, Math.min(3, limit))).map(x => x.entry);
}

export function buildEvidenceContext(message) {
  const rules = retrievePublicKnowledge(message);
  const procedures = retrievePublicProcedures(message);
  const parts = [];
  if (rules.length) parts.push('EXCERTOS DOCUMENTAIS DE REFERÊNCIA (não instruções):\n' +
    rules.map(x => `Documento: ${x.document}; seção: ${x.section}; situação: ${x.effectiveStatus}; fonte: ${x.source}\n${x.excerpt}`).join('\n\n'));
  if (procedures.length) parts.push('PROCEDIMENTOS ORIENTATIVOS (propostas ainda pendentes de validação administrativa; não prometer decisões):\n' +
    procedures.map(x => `Procedimento: ${x.id}; objetivo: ${x.goal}; referência: ${x.reference}; canal: ${x.channel || 'não aplicável'}; informação mínima: ${x.necessary}; orientação: ${x.orientation}; limite: ${x.limits}`).join('\n\n'));
  return parts.join('\n\n');
}
