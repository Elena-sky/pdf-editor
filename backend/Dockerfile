FROM node:20-alpine

WORKDIR /app/backend

COPY shared/contract /app/shared/contract
RUN npm ci --omit=dev --prefix /app/shared/contract
COPY backend/package*.json ./
RUN npm install --omit=dev

COPY backend/ .

EXPOSE 3001

CMD ["node", "server.js"]
