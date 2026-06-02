import { useState, useCallback, useEffect, useMemo } from 'react';
import DropZone from './DropZone';
import PreviewModal from './PreviewModal';
import { toDownloadFileName, sanitizeStemForFileName } from '../utils/downloadFileName';
import { MAX_FILE_SIZE, maxFileSizeLabel } from '../config/limits';
import styles from './ExtractView.module.css';

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function ExtractView({ onExtractingChange }) {
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(null);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(1);
  const [outputName, setOutputName] = useState('');
  const [outputNameEdited, setOutputNameEdited] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [lastDownloadName, setLastDownloadName] = useState(null);

  useEffect(() => {
    onExtractingChange?.(extracting);
  }, [extracting, onExtractingChange]);

  const baseName = file ? sanitizeStemForFileName(file.name) : '';
  const autoName = useMemo(
    () => (file && pageCount ? `${baseName}_pages_${from}-${to}.pdf` : ''),
    [file, pageCount, baseName, from, to]
  );

  const effectiveName = outputNameEdited ? outputName : autoName;

  const rangeError = (() => {
    if (!pageCount) return null;
    if (!Number.isInteger(from) || !Number.isInteger(to)) {
      return 'Specify range';
    }
    if (from < 1) return 'From must be ≥ 1';
    if (from > pageCount) return `From must be ≤ ${pageCount}`;
    if (to < 1) return 'To must be ≥ 1';
    if (to > pageCount) return `To must be ≤ ${pageCount}`;
    if (from > to) return 'From must be ≤ To';
    return null;
  })();

  const canExtract =
    file && pageCount && !rangeError && !extracting && !metaLoading;

  const downloadLabel = useMemo(() => {
    const raw = (effectiveName || autoName || 'extracted').trim() || 'extracted';
    return toDownloadFileName(raw);
  }, [effectiveName, autoName]);

  const handleFile = useCallback(async (newFiles) => {
    const f = newFiles[0];
    if (!f) return;
    if (f.type !== 'application/pdf') {
      setError('Not a PDF');
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setError(`File exceeds ${maxFileSizeLabel}`);
      return;
    }

    const entry = {
      id: `${f.name}-${f.size}-${Date.now()}`,
      file: f,
      name: f.name,
      size: f.size,
    };
    setFile(entry);
    setError(null);
    setSuccess(false);
    setPageCount(null);
    setFrom(1);
    setTo(1);
    setOutputName('');
    setOutputNameEdited(false);
    setMetaLoading(true);

    const fd = new FormData();
    fd.append('file', f);
    try {
      const res = await fetch('/api/preview-pdf', { method: 'POST', body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to read PDF');
      }
      const meta = await res.json();
      setPageCount(meta.pageCount);
      setFrom(1);
      setTo(meta.pageCount);
      setOutputNameEdited(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setMetaLoading(false);
    }
  }, []);

  const removeFile = useCallback(() => {
    setFile(null);
    setPageCount(null);
    setError(null);
    setSuccess(false);
    setFrom(1);
    setTo(1);
    setOutputName('');
    setOutputNameEdited(false);
    setLastDownloadName(null);
  }, []);

  const onNameChange = (e) => {
    setOutputNameEdited(true);
    setOutputName(e.target.value);
  };

  const extract = async () => {
    if (!canExtract) return;
    setExtracting(true);
    setError(null);
    setSuccess(false);

    const raw = (outputNameEdited ? outputName : autoName).trim() || autoName || 'extracted';

    try {
      const fd = new FormData();
      fd.append('file', file.file);
      fd.append('from', String(from));
      fd.append('to', String(to));

      const res = await fetch('/api/split-pdf', { method: 'POST', body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error: ${res.status}`);
      }

      const blob = await res.blob();
      const downloadName = toDownloadFileName(raw);
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
      setExtracting(false);
    }
  };

  return (
    <div className={styles.stack} data-testid="extract-view-root">
      <DropZone
        onFiles={handleFile}
        disabled={extracting}
        multiple={false}
        dropHint="Drag & drop a PDF file here"
      />

      {file && (
        <>
          <div className={styles.infoRow}>
            <span className={styles.fileIcon}>📄</span>
            <div className={styles.info}>
              <span className={styles.name} title={file.name}>
                {file.name}
              </span>
              <span className={styles.meta}>
                {formatSize(file.size)}
                {pageCount != null && ` · ${pageCount} page${pageCount === 1 ? '' : 's'}`}
                {metaLoading && ' · reading…'}
              </span>
            </div>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.previewBtn}
                onClick={() => setPreviewFile(file)}
                disabled={extracting}
              >
                Preview
              </button>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={removeFile}
                disabled={extracting}
              >
                Remove
              </button>
            </div>
          </div>

          {pageCount != null && !metaLoading && (
            <>
              <div className={styles.rangeRow}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="extract-from">
                    From
                  </label>
                  <input
                    id="extract-from"
                    className={styles.numInput}
                    type="number"
                    min={1}
                    max={pageCount}
                    value={from}
                    onChange={(e) => setFrom(parseInt(e.target.value, 10) || 0)}
                    disabled={extracting}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="extract-to">
                    To
                  </label>
                  <input
                    id="extract-to"
                    className={styles.numInput}
                    type="number"
                    min={1}
                    max={pageCount}
                    value={to}
                    onChange={(e) => setTo(parseInt(e.target.value, 10) || 0)}
                    disabled={extracting}
                  />
                </div>
                <div className={styles.nameField}>
                  <label className={styles.label} htmlFor="extract-out-name">
                    Output file name
                  </label>
                  <input
                    id="extract-out-name"
                    className={styles.nameInput}
                    type="text"
                    value={effectiveName}
                    onChange={onNameChange}
                    disabled={extracting}
                    autoComplete="off"
                    spellCheck="false"
                    placeholder={autoName}
                  />
                  <span className={styles.hint}>.pdf is added if omitted</span>
                </div>
              </div>
              {rangeError && <p className={styles.rangeError}>{rangeError}</p>}
            </>
          )}

          {error && (
            <div className={styles.error}>
              <pre>{error}</pre>
            </div>
          )}

          {success && lastDownloadName && (
            <div className={styles.success}>
              <span>✓</span> {lastDownloadName} downloaded successfully!
            </div>
          )}

          {pageCount != null && !metaLoading && (
            <button
              type="button"
              className={styles.actionBtn}
              onClick={extract}
              disabled={!canExtract}
            >
              {extracting ? (
                <>
                  <span className={styles.spinner} />
                  Extracting…
                </>
              ) : (
                <>
                  ✂ Extract pages {from}–{to} → {downloadLabel}
                </>
              )}
            </button>
          )}
        </>
      )}

      {!file && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📄</div>
          <p>Drop a PDF file to extract pages</p>
          <p className={styles.emptyHint}>1 file · max {maxFileSizeLabel}</p>
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
