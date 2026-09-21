FROM node:22-bookworm-slim

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV BAILEYS_AUTH_PATH=/data/baileys-auth
ENV STATE_PATH=/data/state-baileys.json

EXPOSE 3000

CMD ["npm", "start"]
