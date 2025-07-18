document.addEventListener("DOMContentLoaded", () => {
  const formulario = document.querySelector("form");
  const inputUsuario = document.getElementById("pergunta");
  const respostaDiv = document.getElementById("resposta");
  const threadInput = document.getElementById("thread_id");

  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();

    const mensagem = inputUsuario.value.trim();
    const thread_id = threadInput.value || null;

    if (!mensagem) return;

    respostaDiv.innerHTML = "<p><em>Pensando...</em></p>";

    try {
      console.log("Enviando pergunta para proxy...");
      const resposta = await fetch("https://maxbot-gamma.vercel.app/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mensagem: mensagem,
          thread_id: thread_id,
        }),
      });

      const data = await resposta.json();
      console.log("Resposta recebida:", data);

      if (data.resposta) {
        respostaDiv.innerHTML = `<p>${data.resposta}</p>`;
        threadInput.value = data.thread_id;
      } else {
        respostaDiv.innerHTML = `<p><em>Sem resposta do assistente.</em></p>`;
      }

    } catch (error) {
      console.error("Erro ao enviar pergunta:", error);
      respostaDiv.innerHTML = `<p><em>Erro de conexão com o servidor.</em></p>`;
    }

    inputUsuario.value = "";
  });
});
