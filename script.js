const form = document.getElementById("pergunta-form");
const input = document.getElementById("pergunta");
const respostaDiv = document.getElementById("resposta");
let thread_id = null;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const pergunta = input.value.trim();
  if (!pergunta) return;

  adicionarMensagem("Você", pergunta, "user");
  input.value = "";

  try {
    console.log("Enviando pergunta para proxy...");

    const resposta = await fetch("https://maxbot-gamma.vercel.app/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagem: pergunta, thread_id }),
    });

    const data = await resposta.json();
    thread_id = data.thread_id;

    if (data.resposta) {
      adicionarMensagem("MaxBot", data.resposta, "bot");
    } else {
      adicionarMensagem("Erro", "Não houve resposta do assistente.", "erro");
    }
  } catch (erro) {
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
    div.textContent = `${remetente}: ${mensagem}`;
  }

  respostaDiv.appendChild(div);
  respostaDiv.scrollTop = respostaDiv.scrollHeight;
}
