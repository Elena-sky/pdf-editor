# ── Stage 1: build ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ── Stage 2: serve via nginx ─────────────────────────────────────
FROM nginx:1.25-alpine

# Default nginx mime.types lists only .js, not .mjs — browser rejects pdf.js worker as a module
RUN sed -i 's/\(application\/javascript[[:space:]]*\)js;$/\1js mjs;/' /etc/nginx/mime.types

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
