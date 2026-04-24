import { useState, useRef, useCallback } from 'react';
import styles from './DropZone.module.css';

export default function DropZone({ onFiles, disabled }) {
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
    if (dropped.length > 0) onFiles(dropped);
  }, [onFiles, disabled]);

  const handleChange = useCallback((e) => {
    const selected = Array.from(e.target.files);
    if (selected.length > 0) onFiles(selected);
    e.target.value = '';
  }, [onFiles]);

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
        multiple
        onChange={handleChange}
        style={{ display: 'none' }}
      />

      <div className={styles.icon}>
        {dragging ? '📂' : '📄'}
      </div>
      <p className={styles.text}>
        {dragging
          ? 'Drop PDFs here'
          : 'Drag & drop PDFs here'}
      </p>
      <p className={styles.sub}>or click to browse files</p>
      <div className={styles.badge}>PDF only · max 20 MB each</div>
    </div>
  );
}
