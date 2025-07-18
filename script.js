let threadId = localStorage.getItem("thread_id") || "";

async function enviarMensagem() {
  const input = document.getElementById("mensagem");
  const mensagem = input.value.trim();
  if (!mensagem) return;

  adicionarAoHistorico("Você", mensagem);
  input.value = "";

  try {
    const resposta = await fetch("https://script.google.com/macros/s/AKfycbw76DEANHBm7O9hPx1mt4TxWw68Ee9HE_iSO4C6CP15D6vlIwzuwlTcV_BrhKql7j8/exec", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mensagem,
        thread_id: threadId
      })
    });

    const data = await resposta.json();
    adicionarAoHistorico("MaxBot", data.resposta);
    if (data.thread_id) {
      threadId = data.thread_id;
      localStorage.setItem("thread_id", threadId);
    }
  } catch (err) {
    adicionarAoHistorico("MaxBot", "Erro ao conectar com o servidor.");
  }
}

function adicionarAoHistorico(remetente, texto) {
  const historico = document.getElementById("historico");
  const div = document.createElement("div");
  div.innerHTML = `<strong>${remetente}:</strong> ${texto}`;
  historico.appendChild(div);
}
