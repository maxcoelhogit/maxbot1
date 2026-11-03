# MaxBot 2.1 — Como atualizar as orientações operacionais

**Documento principal (Google Drive):** https://docs.google.com/document/d/10S9TnSmgeQklvG4ugHzdPVmvQQKBM-qnrIfPQ8xRoao/edit

## Ativação uma única vez
1. O responsável abre o documento no Google Drive, clica **Compartilhar** > **Acesso geral** > **Qualquer pessoa com o link** > **Leitor**, salva. Somente o responsável conserva direito de edição.
2. **Importante:** o texto se torna acessível a qualquer pessoa com o link. Incluir apenas informações públicas aos moradores. Nunca dados de unidades, inadimplência, credenciais, senhas, dados pessoais, mecanismos internos de segurança ou ocorrências individuais.
3. O servidor tenta obter **exportação TXT de leitura** do documento com validade em cache de até 5 minutos. Em caso de documento privado, erro, remoção do marcador ou indisponibilidade, recorre à `config/orientacoes-local.js`.
4. Manter `MAXBOT_ORIENTACOES_V1` como primeira linha. Não renomear nem apagar o documento sem ajustar a URL em `config/orientacoes-remotas.js`.
5. Para corrigir telefone, regra operacional, aviso público temporário ou procedimento, alterar o documento, acrescentando a fonte e a data quando relevante. A alteração será lida automaticamente até cinco minutos depois *desde que a permissão de leitura pública esteja ativa*.
6. Para alterações de leis, Regulamento, Convenção, privacidade, sistema de acesso, cobrança automatizada, integrações ou comandos, exigir revisão de código/normas; **este documento NÃO autoriza mudanças dessas naturezas**.

## Identidade e fatos estáveis
- Edifício Monções: prédio único com 24 apartamentos, sem blocos.
- AXIA: telefone público confirmado para este fluxo **(12) 3624-7143**. Evitar número de celular/WhatsApp sem validação.
- Respostas textuais WhatsApp: apenas URLs completas podem ser identificadas como links clicáveis com confiabilidade. Use um link relevante por resposta. Botões ou textos-âncora requerem outro tipo de mensagem/integração.
- Identidade WhatsApp: `🔹 MaxBot | Assistente virtual do Edifício Monções`. O símbolo é azul; a cor do emoji 🤖 original depende do aplicativo e sistema do morador.

## Governança
Esta base **complementa** o prompt e documentos normativos já revisados. Não substitui Convenção nem Regulamento. O acesso público é somente de leitura; a Administração controla as alterações no Google Drive. A biblioteca de 2013 segue identificada como referência cuja vigência atual carece de validação.
