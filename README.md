# PDF Merger

Web app to combine several PDF files into one. No account, no cloud upload to a third party — your files are handled for merging and are not kept on the server.

---

## Features

- **Drag and drop** files or pick them with the file dialog  
- **Change the order** of files before merging (drag to reorder)  
- **Preview pages** in the browser before you merge  
- **Download** the merged PDF when you are ready  
- **Only PDFs** are accepted, with reasonable limits on file size and how many files you can add at once  

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

## Limitations

- Does not open PDFs that are **password-protected**  
- **Up to 20 MB** per file  
- **Up to 20 files** in one merge  

---

## License

[MIT](./LICENSE) © 2026 Elena
