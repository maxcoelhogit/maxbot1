import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { REGULAMENTO_2013 } from '../knowledge/regulamento-2013.js';
import { PUBLIC_PROCEDURES } from '../knowledge/procedures.js';
import { retrievePublicKnowledge, retrievePublicProcedures, buildEvidenceContext } from '../knowledge/search.js';
import { identifyAutomatedWhatsAppMessage, MAXBOT_WHATSAPP_SIGNATURE } from '../whatsapp-gateway/message-identity.js';
import handler from '../api/chat.js';
import { MAXBOT_SYSTEM_PROMPT } from '../config/maxbot.js';

const scenarios = [
 ['Que horas começa o silêncio no condomínio?', 'article', 9],
 ['Crianças podem brincar com barulho depois das 22h?', 'article', 9],
 ['Posso colocar música alta e som no apartamento?', 'article', 10],
 ['Quero fazer uma mudança no sábado, quais horários?', 'article', 11],
 ['É permitida mudança e móveis aos domingos?', 'article', 11],
 ['Posso denunciar irregularidades ao síndico por escrito?', 'article', 3],
 ['Tenho direito a documentos do condomínio?', 'article', 3],
 ['Quem repara danos causados por visitantes?', 'article', 6],
 ['Preciso manter a porta do hall fechada?', 'article', 7],
 ['Posso guardar caixas no corredor e hall?', 'article', 8],
 ['Vou viajar, preciso fechar o registro de gás?', 'article', 12],
 ['O que faço com a torneira quando falta água?', 'article', 13],
 ['Onde devo descartar meu lixo?', 'article', 14],
 ['Preciso comunicar contrato de locação?', 'article', 15],
 ['O regulamento precisa constar no contrato de locação?', 'article', 16],
 ['Qual o padrão de cortina de vidro da varanda?', 'article', 17],
 ['Entregador pode entrar no prédio?', 'article', 17],
 ['Posso deixar animal nas áreas comuns?', 'article', 17],
 ['É permitido fumar dentro do elevador?', 'article', 17],
 ['Skate nas áreas comuns é permitido?', 'article', 17],
 ['Minhas vagas de garagem são demarcadas?', 'article', 18],
 ['Posso lavar o carro dentro da garagem?', 'article', 19],
 ['Posso guardar bicicletas na vaga da garagem?', 'article', 19],
 ['Posso usar buzina da garagem?', 'article', 19],
 ['Preciso aguardar o portão da garagem fechar?', 'article', 19],
 ['A reincidência gera advertência e multa?', 'article', 22],
 ['Como alterar regulamento em assembleia e quorum?', 'article', 23],
 ['Quem decide os casos omissos para tranquilidade?', 'article', 25],
 ['Visitantes entram sem autorização do morador?', 'article', 21],
 ['Acesso do síndico para manutenção tubulações gerais', 'article', 20],
 ['Minha identidade de reclamante será mantida em sigilo?', 'procedure', 'confidencialidade'],
 ['Como faço uma reclamação e denúncia formal?', 'procedure', 'reclamacoes'],
 ['Quero imagens das câmeras CFTV de ontem', 'procedure', 'cftv'],
 ['Posso pedir imagens próprias de gravação?', 'procedure', 'cftv'],
 ['Como cadastrar biometria facial?', 'procedure', 'biometria'],
 ['Preciso de outro controle remoto para o portão', 'procedure', 'controles'],
 ['Como peço manutenção de um vazamento?', 'procedure', 'manutencao'],
 ['Pessoa presa no elevador, qual telefone?', 'procedure', 'elevador'],
 ['Preciso de segunda via do boleto da AXIA', 'procedure', 'financeiro'],
 ['Onde baixo documentos e atas da assembleia?', 'procedure', 'documentos'],
 ['Quem cuida das regras de garagem e vagas?', 'procedure', 'garagem'],
 ['Minha defesa contra advertência e multa', 'procedure', 'penalidades'],
 ['Como proceder se a criança perturbar o sossego?', 'procedure', 'sossego'],
 ['Qual é a senha do servidor e token secreto?', 'none', null],
 ['Quem está inadimplente e qual CPF do vizinho?', 'none', null],
 ['CONTEXTO RECENTE DE ATENDIMENTO HUMANO\\nDado irrelevante\\n\\nMENSAGEM ATUAL DO CONTATO\\nHorário de silêncio?', 'article', 9]
];
test('46 cenários: cobertura da seleção documental e dos procedimentos (sem simular qualidade da resposta da IA)', () => {
  assert.equal(scenarios.length, 46);
  const failures = [];
  for (const [query, kind, target] of scenarios) {
    const rules = retrievePublicKnowledge(query);
    const procedures = retrievePublicProcedures(query);
    if (kind === 'article' && !rules.some(x => x.article === target)) failures.push(`Artigo ${target}: ${query}`);
    if (kind === 'procedure' && !procedures.some(x => x.id === target)) failures.push(`Procedimento ${target}: ${query}`);
    if (kind === 'none' && (rules.length || procedures.length)) failures.push(`Resultado indevido: ${query}`);
  }
  assert.deepEqual(failures, []);
});
test('25 artigos consecutivos, fonte e vigência explicitamente cautelosa', () => {
  assert.equal(REGULAMENTO_2013.length, 25);
  assert.deepEqual(REGULAMENTO_2013.map(x=>x.article), Array.from({length:25}, (_,i)=>i+1));
  assert.equal(PUBLIC_PROCEDURES.length, 12);
  const text = buildEvidenceContext('silêncio multa');
  assert.match(text,/vigência atual pendente/);
  assert.match(text,/Regulamento Interno/);
});
test('não injeta arquivos administrativos privados na biblioteca pública', () => {
  const all = JSON.stringify({REGULAMENTO_2013,PUBLIC_PROCEDURES});
  assert.doesNotMatch(all,/inadimplentes-5\\.pdf|Noele Greiciene|data:image|ADMIN_TOKEN|OPENAI_API_KEY/);
});
test('assinatura institucional uma única vez, somente no texto entregue ao transporte', () => {
  const value = identifyAutomatedWhatsAppMessage('Olá! Já encontrei o art. 9º.');
  assert.equal(value,MAXBOT_WHATSAPP_SIGNATURE + String.fromCharCode(10, 10) + 'Olá! Já encontrei o art. 9º.');
  assert.equal(identifyAutomatedWhatsAppMessage(value),value);
  assert.equal(identifyAutomatedWhatsAppMessage(MAXBOT_WHATSAPP_SIGNATURE+String.fromCharCode(10, 10)+value),value);
  assert.equal(identifyAutomatedWhatsAppMessage(''), '');
});
test('handoff, estado e pendingBotSends preservados no caminho do gateway (verificação estrutural)', () => {
  const code=fs.readFileSync(new URL('../whatsapp-gateway/index-baileys.js', import.meta.url),'utf8');
  for(const token of ['HUMAN_PAUSE_MINUTES','getChatMode(jid)','pauseForHuman(jid)','appendHumanContext(jid','pendingBotSends.set(jid','body: outbound','{ text: outbound }','#bot on','#bot off','state.threads[chatId]','useMultiFileAuthState(AUTH_PATH)']) assert.ok(code.includes(token),token);
  assert.ok(code.indexOf('const outbound = identifyAutomatedWhatsAppMessage(answer)') < code.indexOf('pendingBotSends.set(jid'));
});
test('prompt protege LGPD, reclamações e limita decisões administrativas', () => {
  for(const token of ['identidade do reclamante','CFTV:','Não prometa advertências','direito','vigência atual','AXIA']) assert.ok(MAXBOT_SYSTEM_PROMPT.includes(token),token);
});
test('backend mantém contrato previous_response_id/thread_id e injeta apenas fonte relevante', async () => {
  const fetchBefore=globalThis.fetch, keyBefore=process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY='fake-test-token';
  let captured;
  globalThis.fetch=async (_url,options)=>{
    captured=JSON.parse(options.body);
    return {ok:true,json:async()=>({id:'resp_test_123',output_text:'Resposta de teste.'})};
  };
  const result={statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;return this;},status(s){this.statusCode=s;return this;},json(v){this.body=v;return this;},end(){return this;}};
  try{
    await handler({method:'POST',body:{mensagem:'Qual é o horário de silêncio?',thread_id:'resp_old_1'}},result);
    assert.equal(result.statusCode,200);
    assert.deepEqual(result.body,{resposta:'Resposta de teste.',thread_id:'resp_test_123'});
    assert.equal(captured.previous_response_id,'resp_old_1');
    assert.equal(captured.store,true);
    assert.match(captured.instructions,/Art. 9º/);
    assert.doesNotMatch(captured.input,/MaxBot \\| Agente/);
  }finally{
    globalThis.fetch=fetchBefore;
    if(keyBefore===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=keyBefore;
  }
});
