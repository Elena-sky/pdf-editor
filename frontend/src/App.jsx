import { useState, useCallback } from 'react';
import DropZone from './components/DropZone';
import FileList from './components/FileList';
import PreviewModal from './components/PreviewModal';
import styles from './App.module.css';

const MAX_FILE_SIZE = 20 * 1024 * 1024;

export default function App() {
  const [files, setFiles] = useState([]);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const addFiles = useCallback((newFiles) => {
    setError(null);
    setSuccess(false);
    const validated = [];
    const errors = [];

    for (const file of newFiles) {
      if (file.type !== 'application/pdf') {
        errors.push(`"${file.name}" — not a PDF file`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`"${file.name}" exceeds 20MB limit`);
        continue;
      }
      validated.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
      });
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    setFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const unique = validated.filter((f) => !existingNames.has(f.name));
      return [...prev, ...unique];
    });
  }, []);

  const removeFile = useCallback((id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setSuccess(false);
  }, []);

  const reorderFiles = useCallback((newOrder) => {
    setFiles(newOrder);
  }, []);

  const mergePdfs = async () => {
    if (files.length < 2) {
      setError('Please add at least 2 PDF files to merge');
      return;
    }

    setMerging(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f.file));
      // Send order as original indices (0..n since we pass files in order)
      formData.append('order', files.map((_, i) => i).join(','));

      const response = await fetch('/api/merge-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setMerging(false);
    }
  };

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⊞</span>
          <span>PDF Merger</span>
        </div>
        <p className={styles.subtitle}>Combine multiple PDF files into one — fast and private</p>
      </header>

      <main className={styles.main}>
        <DropZone onFiles={addFiles} disabled={merging} />

        {files.length > 0 && (
          <div className={styles.fileSection}>
            <div className={styles.fileSectionHeader}>
              <div className={styles.fileCount}>
                <strong>{files.length}</strong> file{files.length !== 1 ? 's' : ''}
                <span className={styles.totalSize}>{formatSize(totalSize)}</span>
              </div>
              <button
                className={styles.clearBtn}
                onClick={() => { setFiles([]); setError(null); setSuccess(false); }}
                disabled={merging}
              >
                Clear all
              </button>
            </div>

            <FileList
              files={files}
              onRemove={removeFile}
              onReorder={reorderFiles}
              onPreview={setPreviewFile}
              disabled={merging}
            />

            {error && (
              <div className={styles.error}>
                <span className={styles.errorIcon}>⚠</span>
                <pre>{error}</pre>
              </div>
            )}

            {success && (
              <div className={styles.success}>
                <span>✓</span> merged.pdf downloaded successfully!
              </div>
            )}

            <button
              className={styles.mergeBtn}
              onClick={mergePdfs}
              disabled={merging || files.length < 2}
            >
              {merging ? (
                <>
                  <span className={styles.spinner} />
                  Merging…
                </>
              ) : (
                <>⊞ Merge {files.length} PDFs</>
              )}
            </button>

            {files.length < 2 && !merging && (
              <p className={styles.hint}>Add at least 2 files to merge</p>
            )}
          </div>
        )}

        {files.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📄</div>
            <p>Drop your PDF files above to get started</p>
            <p className={styles.emptyHint}>Up to 20 files · Max 20 MB each</p>
          </div>
        )}
      </main>

      {previewFile && (
        <PreviewModal
          file={previewFile.file}
          name={previewFile.name}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}
