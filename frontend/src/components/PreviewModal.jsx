import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './PreviewModal.module.css';

let pdfjsLib = null;

async function getPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  pdfjsLib = await import('pdfjs-dist');
  // Use the bundled worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).href;
  return pdfjsLib;
}

export default function PreviewModal({ file, name, onClose }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const canvasRef = useRef(null);
  const pdfDocRef = useRef(null);

  // Load PDF document
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const lib = await getPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await lib.getDocument({ data: arrayBuffer }).promise;

        if (cancelled) return;

        pdfDocRef.current = pdf;
        setPages(Array.from({ length: pdf.numPages }, (_, i) => i + 1));
        setCurrentPage(1);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [file]);

  // Render current page to canvas
  useEffect(() => {
    if (!currentPage || !pdfDocRef.current || !canvasRef.current) return;

    let cancelled = false;

    async function renderPage() {
      try {
        const pdf = pdfDocRef.current;
        const page = await pdf.getPage(currentPage);
        if (cancelled) return;

        const viewport = page.getViewport({ scale: 1.4 });
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    renderPage();
    return () => { cancelled = true; };
  }, [currentPage]);

  const prev = useCallback(() => setCurrentPage((p) => Math.max(1, p - 1)), []);
  const next = useCallback(() => setCurrentPage((p) => Math.min(pages.length, p + 1)), [pages.length]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <header className={styles.header}>
          <div className={styles.title}>
            <span>📄</span>
            <span className={styles.fileName}>{name}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="Close (Esc)">✕</button>
        </header>

        <div className={styles.body}>
          {loading && (
            <div className={styles.center}>
              <div className={styles.spinner} />
              <p>Loading PDF…</p>
            </div>
          )}

          {error && (
            <div className={styles.center}>
              <p className={styles.errorText}>⚠ {error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className={styles.canvasWrapper}>
              <canvas ref={canvasRef} className={styles.canvas} />
            </div>
          )}
        </div>

        {!loading && !error && pages.length > 0 && (
          <footer className={styles.footer}>
            <button
              className={styles.navBtn}
              onClick={prev}
              disabled={currentPage <= 1}
            >
              ← Prev
            </button>

            <span className={styles.pageInfo}>
              Page <strong>{currentPage}</strong> of <strong>{pages.length}</strong>
            </span>

            <button
              className={styles.navBtn}
              onClick={next}
              disabled={currentPage >= pages.length}
            >
              Next →
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
