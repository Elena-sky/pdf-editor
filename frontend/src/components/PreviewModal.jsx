import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './PreviewModal.module.css';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

let pdfjsLib = null;

async function getPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  return pdfjsLib;
}

export default function PreviewModal({ file, name, onClose }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const canvasRef = useRef(null);
  const pdfDocRef = useRef(null);
  const renderTaskRef = useRef(null);

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

  // Render current page to canvas — cancel in-flight render when page changes
  useEffect(() => {
    if (!currentPage || !pdfDocRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    let alive = true;

    const cancelOngoing = () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
        renderTaskRef.current = null;
      }
    };

    const run = async () => {
      try {
        cancelOngoing();
        const pdf = pdfDocRef.current;
        const page = await pdf.getPage(currentPage);
        if (!alive) return;

        const viewport = page.getViewport({ scale: 1.4 });
        const ctx = canvas.getContext('2d', { willReadFrequently: false });
        if (!alive) return;

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const task = page.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = task;
        try {
          await task.promise;
        } finally {
          if (renderTaskRef.current === task) {
            renderTaskRef.current = null;
          }
        }
      } catch (err) {
        if (!alive) return;
        if (err?.name === 'RenderingCancelledException' || err?.name === 'AbortError') {
          return;
        }
        setError(err?.message || String(err));
      }
    };

    run();
    return () => {
      alive = false;
      cancelOngoing();
    };
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
