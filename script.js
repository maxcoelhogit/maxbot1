document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("formulario");
  const input = document.getElementById("mensagem");
  const chat = document.getElementById("chat");

  let thread_id = "";

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const mensagem = input.value.trim();
    if (!mensagem) return;

    adicionarMensagem("Você", mensagem, "user");
    input.value = "";
    input.disabled = true;

    try {
      const resposta = await fetch("https://script.googleusercontent.com/a/macros/condovale.com.br/echo?user_content_key=AehSKLjNc_rfWu6YInzloSFqnXMIy0GvTLuzUJMVFOBmtvnOuSzvamxxsoFouJ7Zv_KMks8OSS1QCXBpLtP2-oTojM-Q7drr9KVaMMPF-rgaQCXsxFqclBOQErDZ8VDmFRzXRjM4RUlTd3icjmG7TJ5p9ujO7YlwYQdZOsyM8bgBZOLTicbo6EHHpvySNzwu_yPNDtiwkBmBUPR_9UorUnRv-dvbIP8eG8uw3hjyuaBb91FUZRfisV7vtjnUiPFkCRj4gX5p8AoauLh4-B3C0n2pI2LE94ldcRVOufOlpv9M2P-1pjIf5aA9_-5NN4miBg&lib=M-p1kd9EAcWVAyx4TSOssz_p6K4dVRFHJ", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mensagem: mensagem,
          thread_id: thread_id
        }),
      });

      if (!resposta.ok) throw new Error("Falha ao se conectar ao servidor.");

      const dados = await resposta.json();

      if (dados.resposta) {
        thread_id = dados.thread_id || thread_id;
        adicionarMensagem("MaxBot", dados.resposta, "bot");
      } else {
        adicionarMensagem("MaxBot", "Erro ao processar a resposta.", "erro");
      }
    } catch (erro) {
      console.error(erro);
      adicionarMensagem("MaxBot", "Erro ao conectar com o servidor.", "erro");
    }

    input.disabled = false;
    input.focus();
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

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }
});
