import { useState, useRef, useCallback } from 'react';
import { useUploadLimits } from '../hooks/useUploadLimits';
import styles from './DropZone.module.css';

export default function DropZone({ onFiles, disabled, multiple = true, dropHint }) {
  const { maxFileSizeLabel } = useUploadLimits();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    if (disabled) return;
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) onFiles(multiple ? dropped : dropped.slice(0, 1));
  }, [onFiles, disabled, multiple]);

  const handleChange = useCallback((e) => {
    const selected = Array.from(e.target.files);
    if (selected.length > 0) onFiles(multiple ? selected : selected.slice(0, 1));
    e.target.value = '';
  }, [onFiles, multiple]);

  return (
    <div
      className={`${styles.zone} ${dragging ? styles.dragging : ''} ${disabled ? styles.disabled : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple={multiple}
        onChange={handleChange}
        style={{ display: 'none' }}
      />

      <div className={styles.icon}>
        {dragging ? '📂' : '📄'}
      </div>
      <p className={styles.text}>
        {dropHint
          ? dragging
            ? 'Drop PDF here'
            : dropHint
          : dragging
            ? 'Drop PDFs here'
            : 'Drag & drop PDFs here'}
      </p>
      <p className={styles.sub}>or click to browse files</p>
      <div className={styles.badge}>PDF only · max {maxFileSizeLabel} each</div>
    </div>
  );
}
