import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_KEY = process.env.OPENAI_KEY;
const ASSISTANT_ID = process.env.ASSISTANT_ID;

app.post('/ask', async (req, res) => {
  try {
    const { mensagem, thread_id } = req.body;

    const threadResponse = thread_id
      ? { id: thread_id }
      : await fetch('https://api.openai.com/v1/threads', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_KEY}`,
            'OpenAI-Beta': 'assistants=v2',
            'Content-Type': 'application/json'
          }
        }).then(res => res.json());

    const threadId = threadResponse.id;

    await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: 'user', content: mensagem })
    });

    const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'OpenAI-Beta': 'assistants=v2',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ assistant_id: ASSISTANT_ID })
    }).then(res => res.json());

    const runId = runRes.id;

    let status = 'in_progress', output;
    while (status === 'in_progress') {
      await new Promise(r => setTimeout(r, 2000));
      const runCheck = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${OPENAI_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      }).then(res => res.json());

      status = runCheck.status;
    }

    const messagesRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    }).then(res => res.json());

    const resposta = messagesRes.data.find(msg => msg.role === 'assistant')?.content[0]?.text?.value;

    res.json({ resposta, thread_id: threadId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro no servidor' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
