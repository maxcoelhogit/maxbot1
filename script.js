const formulario = document.querySelector("form");
const inputUsuario = document.getElementById("pergunta");
const respostaDiv = document.getElementById("resposta");
const threadInput = document.getElementById("thread_id");

formulario.addEventListener("submit", async (e) => {
  e.preventDefault();

  const mensagem = inputUsuario.value;
  const thread_id = threadInput.value || null;

  respostaDiv.innerHTML = "<p><em>Pensando...</em></p>";

  try {
    const resposta = await fetch("https://maxbot-gamma.vercel.app/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mensagem: mensagem,
        thread_id: thread_id
      }),
    });

    const data = await resposta.json();

    if (data.resposta) {
      respostaDiv.innerHTML = `<p>${data.resposta}</p>`;
      threadInput.value = data.thread_id;
    } else {
      respostaDiv.innerHTML = `<p><em>Não houve resposta do assistente.</em></p>`;
      console.warn("Resposta inválida:", data);
    }

  } catch (error) {
    console.error("Erro ao enviar pergunta:", error);
    respostaDiv.innerHTML = `<p><em>Erro ao conectar ao servidor.</em></p>`;
  }

  inputUsuario.value = "";
});
