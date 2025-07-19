document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.querySelector("form");
  const inputUsuario = document.getElementById("pergunta");
  const respostaDiv = document.getElementById("historico"); // corrigido para #historico
  let thread_id = "";

  const endpoint = "https://maxbot-gamma.vercel.app/ask"; // CORRETO com base no seu vercel.json

  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();

    const mensagem = inputUsuario.value.trim();
    if (!mensagem) return;

    adicionarMensagem("Você", mensagem, "user");
    inputUsuario.value = "";
    inputUsuario.disabled = true;

    try {
      const resposta = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mensagem: mensagem,
          thread_id: thread_id
        })
      });

      if (!resposta.ok) throw new Error("Falha ao se conectar ao servidor.");

      const dados = await resposta.json();

      if (dados.resposta) {
        thread_id = dados.thread_id || thread_id;
        adicionarMensagem("MaxBot", dados.resposta, "bot");
      } else {
        adicionarMensagem("MaxBot", "Sem resposta do assistente.", "erro");
      }
    } catch (erro) {
      console.error("Erro ao enviar pergunta:", erro);
      adicionarMensagem("MaxBot", "Erro de conexão com o servidor.", "erro");
    }

    inputUsuario.disabled = false;
    inputUsuario.focus();
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
});
