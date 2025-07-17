async function enviar() {
  const input = document.getElementById('input').value;
  const respostaDiv = document.getElementById('resposta');

  respostaDiv.textContent = 'Pensando... 🤔';

  try {
    const resposta = await fetch('URL_DO_SEU_WEBAPP', {
      method: 'POST',
      body: JSON.stringify({ mensagem: input }),
      headers: { 'Content-Type': 'application/json' }
    });

    const dados = await resposta.json();
    respostaDiv.textContent = dados.resposta || 'Erro ao gerar resposta.';
  } catch (e) {
    respostaDiv.textContent = 'Erro na conexão.';
    console.error(e);
  }
}
