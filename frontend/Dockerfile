# ── Stage 1: build ──────────────────────────────────────────────
FROM node:20-alpine AS builder

ARG VITE_MAX_FILE_SIZE_MB=100
ARG VITE_MAX_FILES=20
ENV VITE_MAX_FILE_SIZE_MB=$VITE_MAX_FILE_SIZE_MB
ENV VITE_MAX_FILES=$VITE_MAX_FILES

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ── Stage 2: serve via nginx ─────────────────────────────────────
FROM nginx:1.25-alpine

ARG MAX_FILE_SIZE_MB=100
ARG MAX_FILES=20

# Default nginx mime.types lists only .js, not .mjs — browser rejects pdf.js worker as a module
RUN sed -i 's/\(application\/javascript[[:space:]]*\)js;$/\1js mjs;/' /etc/nginx/mime.types

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /tmp/nginx.conf
RUN MAX_BODY_MB=$((MAX_FILE_SIZE_MB * MAX_FILES)) && \
    sed "s/__CLIENT_MAX_BODY_SIZE__/${MAX_BODY_MB}m/" /tmp/nginx.conf > /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
