let threadId = localStorage.getItem("thread_id") || "";

async function enviarMensagem() {
  const input = document.getElementById("mensagem");
  const mensagem = input.value.trim();
  if (!mensagem) return;

  adicionarAoHistorico("Você", mensagem);
  input.value = "";

  try {
    const resposta = await fetch("https://script.googleusercontent.com/a/macros/condovale.com.br/echo?user_content_key=AehSKLijkQsfyI-5bzi4I0a00UpcWX-b41BFMvJw7mRVwU3XLonNkalD-wBfam4IjTdFlIhMpgK_MwiwdlxyW674dGLZcTfvEi_TWjuBJyUkheDo5k6egR1dAZfBb15LKYJdxrSQikLTaIJ9JM3e0LRQbbIzvc1BENcMEylSGnrq6CWIklmqA7N_XB1KFCtg-1U6RItLXNSvXIIseYY2GRXwubu2tEt8uvy97eiBdJbHCLKMG0N3gqSUY9l2eBNPMtpZgJOf2EeqMS0fH6XnQni9bWAYX2cNHjTWopmupL-zwdR8S3rdXIG43dK--JVHYg&lib=M-p1kd9EAcWVAyx4TSOssz_p6K4dVRFHJ", {
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
