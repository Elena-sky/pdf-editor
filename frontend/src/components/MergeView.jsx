import { useState, useCallback, useEffect } from 'react';
import DropZone from './DropZone';
import FileList from './FileList';
import PreviewModal from './PreviewModal';
import { mergePdf } from '../api/pdf';
import { toDownloadFileName, DEFAULT_OUTPUT_NAME } from '../utils/downloadFileName';
import { triggerBlobDownload } from '../utils/triggerDownload';
import { validatePdfFile } from '../utils/validatePdfFile';
import { useUploadLimits } from '../hooks/useUploadLimits';
import styles from './MergeView.module.css';

export default function MergeView({ onMergingChange }) {
  const { maxFileSize, maxFileSizeLabel, maxFiles } = useUploadLimits();
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
    let slotsLeft = maxFiles - files.length;

    for (const file of newFiles) {
      const check = validatePdfFile(file, { maxFileSize, maxFileSizeLabel });
      if (!check.ok) {
        errors.push(check.error);
        continue;
      }
      if (slotsLeft <= 0) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        continue;
      }
      validated.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
      });
      slotsLeft -= 1;
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    setFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const unique = validated.filter((f) => !existingNames.has(f.name));
      return [...prev, ...unique];
    });
  }, [files.length, maxFileSize, maxFileSizeLabel, maxFiles]);

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

      const blob = await mergePdf(formData);
      const downloadName = toDownloadFileName(outputFileName);
      triggerBlobDownload(blob, downloadName);

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
          <p className={styles.emptyHint}>
            Up to {maxFiles} files · Max {maxFileSizeLabel} each
          </p>
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
