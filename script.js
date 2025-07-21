const form = document.getElementById("pergunta-form");
const input = document.getElementById("pergunta");
const respostaDiv = document.getElementById("resposta");
let thread_id = null;

// Saudação inicial
window.onload = () => {
  adicionarMensagem(
    "MaxBot",
    "👋 Olá! Sou o MaxBot, o assistente virtual do seu condomínio. Estou aqui para te ajudar com dúvidas, notificações, documentos, regras internas e muito mais. Digite sua mensagem abaixo e veja como posso ajudar. 😊",
    "bot"
  );
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const pergunta = input.value.trim();
  if (!pergunta) return;

  adicionarMensagem("Você", pergunta, "user");
  input.value = "";

  // ✅ Adiciona dinamicamente a animação "digitando"
  const digitando = document.createElement("div");
  digitando.classList.add("mensagem-bot");
  digitando.textContent = "MaxBot está digitando...";
  respostaDiv.appendChild(digitando);
  respostaDiv.scrollTop = respostaDiv.scrollHeight;

  try {
    const resposta = await fetch("https://maxbot-gamma.vercel.app/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagem: pergunta, thread_id }),
    });

    const data = await resposta.json();
    thread_id = data.thread_id;

    // ✅ Remove o "digitando" antes de mostrar a resposta real
    respostaDiv.removeChild(digitando);

    if (data.resposta) {
      adicionarMensagem("MaxBot", formatarLinks(data.resposta), "bot", true);
    } else {
      adicionarMensagem("Erro", "Não houve resposta do assistente.", "erro");
    }
  } catch (erro) {
    respostaDiv.removeChild(digitando);
    console.error("Erro ao enviar pergunta:", erro);
    adicionarMensagem("Erro", "Erro ao se conectar ao servidor.", "erro");
  }
});

function adicionarMensagem(remetente, mensagem, tipo, isHTML = false) {
  const div = document.createElement("div");
  div.classList.add("mensagem");

  if (tipo === "user") {
    div.classList.add("mensagem-usuario");
    div.innerHTML = `<strong>${remetente}:</strong> ${mensagem}`;
  } else if (tipo === "bot") {
    div.classList.add("mensagem-bot");
    div.innerHTML = isHTML
      ? `<strong>${remetente}:</strong> ${mensagem}`
      : `<strong>${remetente}:</strong> ${escapeHTML(mensagem)}`;
  } else {
    div.classList.add("mensagem-erro");
    div.textContent = `${remetente}: ${mensagem}`;
  }

  respostaDiv.appendChild(div);
  respostaDiv.scrollTop = respostaDiv.scrollHeight;
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatarLinks(texto) {
  const regex = /(https?:\/\/[^\s]+)/g;
  return texto.replace(regex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">Clique aqui</a>`;
  });
}
