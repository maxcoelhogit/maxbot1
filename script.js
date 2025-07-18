const ENDPOINT = "https://script.google.com/macros/s/AKfycbwT_JDV0N-6TJPKvnVtFRX7BYvJl7HxcclNu5BV0bV3KwsvaIH5TjQIO_HPusdWq6Y/exec";

document.getElementById("pergunta-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const input = document.getElementById("pergunta");
  const pergunta = input.value.trim();
  if (!pergunta) return;

  // Limpa campo
  input.value = "";

  // Adiciona pergunta ao histórico
  const historico = document.getElementById("historico");
  const perguntaElem = document.createElement("div");
  perguntaElem.className = "pergunta";
  perguntaElem.textContent = "Você: " + pergunta;
  historico.appendChild(perguntaElem);

  // Usa ou cria novo thread_id
  let threadId = localStorage.getItem("thread_id") || "";

  try {
    const resposta = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagem: pergunta, thread_id: threadId })
    });

    const data = await resposta.json();

    // Atualiza thread_id se necessário
    if (data.thread_id) {
      localStorage.setItem("thread_id", data.thread_id);
    }

    // Mostra resposta
    const respostaElem = document.createElement("div");
    respostaElem.className = "resposta";
    respostaElem.textContent = "MaxBot: " + (data.resposta || "Erro ao responder.");
    historico.appendChild(respostaElem);

  } catch (err) {
    const erroElem = document.createElement("div");
    erroElem.className = "erro";
    erroElem.textContent = "MaxBot: Erro ao conectar com o servidor.";
    historico.appendChild(erroElem);
  }
});
