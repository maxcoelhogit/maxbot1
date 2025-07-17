const chatBox = document.getElementById('chat');
const input = document.getElementById('input');

// Substitua pela URL do seu Web App:
const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbxc2rktlNwFbdrrasIIVG0ReYfha7oEGnqzPgtFupgcfBdeDlOiDXOrH7-L3ejv2K8/exec";

async function enviar() {
  const texto = input.value.trim();
  if (!texto) return;

  adicionarMensagem(texto, 'user');
  input.value = ''; // limpa automaticamente

  adicionarMensagem('Digitando...', 'bot');

  try {
    const resposta = await fetch(WEBAPP_URL, {
      method: 'POST',
      body: JSON.stringify({ mensagem: texto }),
      headers: { 'Content-Type': 'application/json' }
    });

    const dados = await resposta.json();
    atualizarUltimaMensagem(dados.resposta || 'Erro ao gerar resposta.');
  } catch (e) {
    atualizarUltimaMensagem('Erro na conexão.');
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
