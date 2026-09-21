# MaxBot WhatsApp Gateway

Gateway separado do MaxBot WebApp para vincular o WhatsApp Business como dispositivo adicional e encaminhar mensagens recebidas ao backend atual do MaxBot.

## Arquitetura

WhatsApp Business → dispositivo vinculado → Railway → MaxBot API/Vercel → OpenAI

## Endpoints

- `/health` — saúde básica do serviço
- `/status?token=...` — status administrativo
- `/qr?token=...` — QR Code para vincular o WhatsApp

## Variáveis

- `MAXBOT_API_URL`
- `ADMIN_TOKEN`
- `WHATSAPP_AUTH_PATH=/data/auth`
- `STATE_PATH=/data/state.json`
- `HUMAN_PAUSE_MINUTES=30`

## Handoff humano

Quando uma mensagem é enviada manualmente pelo WhatsApp Business, o bot pausa aquela conversa por 30 minutos.

Comandos enviados manualmente:
- `#bot off` — desliga o bot naquela conversa
- `#bot on` — reativa o bot naquela conversa

## Persistência

Para produção, monte armazenamento persistente do Railway em `/data` antes de vincular o QR Code. Isso preserva a sessão do WhatsApp e o estado das conversas após reinícios/redeploys.
