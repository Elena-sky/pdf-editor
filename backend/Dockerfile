FROM node:20-alpine

WORKDIR /app/backend

RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

COPY shared/contract /app/shared/contract
RUN npm ci --omit=dev --prefix /app/shared/contract

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ .

EXPOSE 3001

CMD ["node", "server.js"]
