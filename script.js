const chatBox = document.getElementById('chat');
const input = document.getElementById('input');
const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzpn8-JsSNw8y7LL_V9nD941Z9r4lAvMRQFlt8YC4MWwfg3sZrfF3MXki8BXbzngJo/exec";

async function enviar() {
  const texto = input.value.trim();
  if (!texto) return;

  adicionarMensagem(texto, 'user');
  input.value = '';

  adicionarMensagem('Digitando...', 'bot');

  const threadId = sessionStorage.getItem("thread_id") || "";

  try {
    const resposta = await fetch(WEBAPP_URL, {
      method: 'POST',
      body: JSON.stringify({ mensagem: texto, thread_id: threadId }),
      headers: { 'Content-Type': 'application/json' }
    });

    const dados = await resposta.json();

    if (dados.thread_id) {
      sessionStorage.setItem("thread_id", dados.thread_id);
    }

    atualizarUltimaMensagem(dados.resposta || 'Erro ao gerar resposta.');
  } catch (e) {
    atualizarUltimaMensagem('Erro na conexão.');
    console.error(e);
  }
}

function adicionarMensagem(msg, classe) {
  const div = document.createElement('div');
  div.className = `msg ${classe}`;
  div.textContent = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function atualizarUltimaMensagem(texto) {
  const msgs = chatBox.querySelectorAll('.msg.bot');
  if (msgs.length) {
    msgs[msgs.length - 1].textContent = texto;
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}
