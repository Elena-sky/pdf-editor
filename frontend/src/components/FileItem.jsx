import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from './FileItem.module.css';

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function FileItem({ file, index, onRemove, onPreview, disabled }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.item} ${isDragging ? styles.dragging : ''}`}
    >
      {/* Drag handle */}
      <button
        className={styles.handle}
        {...attributes}
        {...listeners}
        disabled={disabled}
        title="Drag to reorder"
        aria-label="Drag to reorder"
      >
        ⠿
      </button>

      {/* Order badge */}
      <span className={styles.order}>{index + 1}</span>

      {/* PDF icon */}
      <span className={styles.fileIcon}>📄</span>

      {/* File info */}
      <div className={styles.info}>
        <span className={styles.name} title={file.name}>{file.name}</span>
        <span className={styles.size}>{formatSize(file.size)}</span>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.previewBtn}
          onClick={() => onPreview(file)}
          disabled={disabled}
        >
          Preview
        </button>
        <button
          type="button"
          className={styles.removeBtn}
          onClick={() => onRemove(file.id)}
          disabled={disabled}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
