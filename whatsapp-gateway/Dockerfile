FROM node:22-bookworm-slim

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium ca-certificates fonts-liberation \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV CHROMIUM_PATH=/usr/bin/chromium
ENV WHATSAPP_AUTH_PATH=/data/auth
ENV STATE_PATH=/data/state.json

EXPOSE 3000

CMD ["npm", "start"]
