const form = document.getElementById("pergunta-form");
const input = document.getElementById("pergunta");
const respostaDiv = document.getElementById("resposta");
let thread_id = null;

// Saudação inicial
window.onload = () => {
  adicionarMensagem(
    "MaxBot",
    transformarLinksEmCliqueAqui("👋 Olá! Sou o MaxBot, o assistente virtual do seu condomínio. Estou aqui para te ajudar com dúvidas, notificações, documentos, regras internas e muito mais. Digite sua mensagem abaixo e veja como posso ajudar. 😊"),
    "bot"
  );
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const pergunta = input.value.trim();
  if (!pergunta) return;

  adicionarMensagem("Você", pergunta, "user");
  input.value = "";

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
    respostaDiv.removeChild(digitando);

    if (data.resposta) {
      adicionarMensagem("MaxBot", transformarLinksEmCliqueAqui(data.resposta), "bot");
    } else {
      adicionarMensagem("Erro", "Não houve resposta do assistente.", "erro");
    }
  } catch (erro) {
    respostaDiv.removeChild(digitando);
    console.error("Erro ao enviar pergunta:", erro);
    adicionarMensagem("Erro", "Erro ao se conectar ao servidor.", "erro");
  }
});

function adicionarMensagem(remetente, mensagem, tipo) {
  const div = document.createElement("div");
  div.classList.add("mensagem");

  if (tipo === "user") {
    div.classList.add("mensagem-usuario");
    div.innerHTML = `<strong>${remetente}:</strong> ${mensagem}`;
  } else if (tipo === "bot") {
    div.classList.add("mensagem-bot");
    div.innerHTML = `<strong>${remetente}:</strong> ${mensagem}`;
  } else {
    div.classList.add("mensagem-erro");
    div.innerHTML = `<strong>${remetente}:</strong> ${mensagem}`;
  }

  respostaDiv.appendChild(div);
  respostaDiv.scrollTop = respostaDiv.scrollHeight;
}

// Transforma links soltos e markdown em "Clique aqui"
function transformarLinksEmCliqueAqui(texto) {
  let convertido = texto.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (match, textoLink, url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${textoLink}</a>`;
  });

  convertido = convertido.replace(/(https?:\/\/[^\s]+)/g, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">Clique aqui</a>`;
  });

  return convertido.replace(/\n/g, "<br>");
}

// ✅ Adapta o campo de entrada ao teclado virtual no celular
if (window.visualViewport) {
  visualViewport.addEventListener("resize", () => {
    const alturaTeclado = window.innerHeight - visualViewport.height;
    document.body.style.paddingBottom = alturaTeclado > 0 ? `${alturaTeclado}px` : "0";
  });
}
