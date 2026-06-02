# PDF Editor

Merge several PDFs into one file, or extract a page range from a single PDF. Files are processed per request and not stored on the server.

## Run (Docker)

```bash
git clone https://github.com/Elena-sky/pdf-editor.git
cd pdf-editor
docker compose up --build
```

Open **http://localhost:3000**.

## Features

- **Merge** — upload 2–20 PDFs, reorder, preview, download one file
- **Extract** — one PDF, pick page range (From / To), download result
- **Merge / Extract** toggle in the header without losing in-memory state

## API

In production, `/api` is same-origin (nginx → backend). In dev, Vite proxies `/api` to `http://localhost:3001`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/config` | Upload limits for the UI |
| `POST` | `/api/merge-pdf` | Merge PDFs (`multipart/form-data`) |
| `POST` | `/api/preview-pdf` | Page count for one file |
| `POST` | `/api/split-pdf` | Extract pages (`from`, `to`) |
| `GET` | `/api/openapi.json` | OpenAPI 3 (from Zod) |

Errors: JSON `{ "error": "…" }` with `400`, `422`, `429`, `503`, or `500`.

Separate API host in dev: set `VITE_API_BASE` and backend `CORS_ORIGIN` — see [`.env.example`](.env.example).

## Limits

- PDF only; no password-protected files
- **100 MB** per file (default), **20 files** per merge
- Backend enforces limits; the UI reads `/api/config` (with `VITE_*` as fallback)

## Configuration

Copy [`.env.example`](.env.example) for local env vars (`MAX_FILE_SIZE_MB`, `CORS_ORIGIN`, `VITE_API_BASE`, etc.).

Docker sets `CORS_ORIGIN=` (empty) for same-origin. Rate limits and heavy-route timeouts use backend defaults; override via env in [`backend/config/security.js`](backend/config/security.js) if needed.

## License

[MIT](./LICENSE) © 2026 Elena
