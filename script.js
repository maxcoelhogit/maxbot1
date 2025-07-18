const ENDPOINT = "https://script.googleusercontent.com/a/macros/condovale.com.br/echo?user_content_key=AehSKLjNc_rfWu6YInzloSFqnXMIy0GvTLuzUJMVFOBmtvnOuSzvamxxsoFouJ7Zv_KMks8OSS1QCXBpLtP2-oTojM-Q7drr9KVaMMPF-rgaQCXsxFqclBOQErDZ8VDmFRzXRjM4RUlTd3icjmG7TJ5p9ujO7YlwYQdZOsyM8bgBZOLTicbo6EHHpvySNzwu_yPNDtiwkBmBUPR_9UorUnRv-dvbIP8eG8uw3hjyuaBb91FUZRfisV7vtjnUiPFkCRj4gX5p8AoauLh4-B3C0n2pI2LE94ldcRVOufOlpv9M2P-1pjIf5aA9_-5NN4miBg&lib=M-p1kd9EAcWVAyx4TSOssz_p6K4dVRFHJ";

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
