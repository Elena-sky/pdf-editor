import { useState, useCallback, useEffect } from 'react';
import DropZone from './DropZone';
import FileList from './FileList';
import PreviewModal from './PreviewModal';
import { toDownloadFileName, DEFAULT_OUTPUT_NAME } from '../utils/downloadFileName';
import { MAX_FILE_SIZE, maxFileSizeLabel } from '../config/limits';
import styles from './MergeView.module.css';

export default function MergeView({ onMergingChange }) {
  const [files, setFiles] = useState([]);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [outputFileName, setOutputFileName] = useState(DEFAULT_OUTPUT_NAME);
  const [lastDownloadName, setLastDownloadName] = useState(null);

  useEffect(() => {
    onMergingChange?.(merging);
  }, [merging, onMergingChange]);

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
        errors.push(`"${file.name}" exceeds ${maxFileSizeLabel} limit`);
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
      const downloadName = toDownloadFileName(outputFileName);
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setLastDownloadName(downloadName);
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
    <div className={styles.stack} data-testid="merge-view-root">
      <DropZone onFiles={addFiles} disabled={merging} />

      <div className={styles.nameField}>
        <label className={styles.nameLabel} htmlFor="output-file-name">
          Output file name
        </label>
        <div className={styles.nameInputWrap}>
          <input
            id="output-file-name"
            type="text"
            className={styles.nameInput}
            value={outputFileName}
            onChange={(e) => setOutputFileName(e.target.value)}
            disabled={merging}
            autoComplete="off"
            placeholder={DEFAULT_OUTPUT_NAME}
            spellCheck="false"
          />
          <span className={styles.nameHint}>.pdf is added if omitted</span>
        </div>
      </div>

      {files.length > 0 && (
        <div className={styles.fileSection}>
          <div className={styles.fileSectionHeader}>
            <div className={styles.fileCount}>
              <strong>{files.length}</strong> file{files.length !== 1 ? 's' : ''}
              <span className={styles.totalSize}>{formatSize(totalSize)}</span>
            </div>
            <button
              className={styles.clearBtn}
              onClick={() => {
                setFiles([]);
                setError(null);
                setSuccess(false);
                setOutputFileName(DEFAULT_OUTPUT_NAME);
                setLastDownloadName(null);
              }}
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

          {success && lastDownloadName && (
            <div className={styles.success}>
              <span>✓</span> {lastDownloadName} downloaded successfully!
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
          <p className={styles.emptyHint}>Up to 20 files · Max {maxFileSizeLabel} each</p>
        </div>
      )}

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
