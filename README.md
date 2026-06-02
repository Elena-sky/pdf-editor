# PDF Editor (Merger + Extractor)

Web app to **merge** several PDFs into one or **extract** a page range from a single PDF. No account, no third-party cloud: files are processed for the request and are not kept on the server.

---

## Features

- **Merge** — drag and drop, reorder, preview pages, set output name, download one merged PDF  
- **Extract** — one PDF, choose **From** / **To** (1-based, inclusive), optional output filename, download a new PDF with only those pages  
- **Mode switch** in the header (Merge vs Extract) without losing the other mode’s in-memory state (both views stay mounted)  
- **Only PDFs**, with size and count limits (see below)  

---

## API (HTTP)

All routes are under the same host as the app in production; in local dev the Vite dev server proxies `/api` to the backend (default `http://localhost:3001`).

| Method & path | Body | Response |
|---------------|------|----------|
| `POST /api/merge-pdf` | `multipart/form-data`: `files` (2–20 PDFs), optional `order` (comma indices) | `200` — `application/pdf` |
| `POST /api/preview-pdf` | `multipart/form-data`: `file` (one PDF) | `200` — JSON: `fileName`, `pageCount`, `fileSize` |
| `POST /api/split-pdf` | `multipart/form-data`: `file` (one PDF), `from`, `to` (1-based inclusive integers) | `200` — `application/pdf` |

Error responses: `400` / `422` / `500` with JSON `{ "error": "message" }` where applicable.

---

## Limitations

- Does not open **password-protected** PDFs (and may return 422 for corrupt or encrypted files)  
- **Up to 100 MB** per file (default; see configuration below)  
- Merge: **up to 20 files** in one run  
- Extract: **one file** per request (same per-file size limit)  

### Configuration

Per-file upload limit is controlled by one variable on each tier (keep values in sync):

| Tier | Variable | Default |
|------|----------|---------|
| Backend | `MAX_FILE_SIZE_MB` | `100` |
| Frontend (build) | `VITE_MAX_FILE_SIZE_MB` | `100` |
| Nginx (Docker build) | `MAX_FILE_SIZE_MB` build arg | `100` (`client_max_body_size` = per-file limit × 20 files) |

Example for local dev:

```bash
# backend/.env or shell
export MAX_FILE_SIZE_MB=100

# frontend/.env
VITE_MAX_FILE_SIZE_MB=100
```

---


## Run the app (Docker)

If you have [Docker](https://www.docker.com/) installed:

```bash
git clone https://github.com/Elena-sky/pdf-editor.git
cd pdf-editor
docker compose up --build
```

Then open **http://localhost:3000** in your browser.

---

## License

[MIT](./LICENSE) © 2026 Elena
