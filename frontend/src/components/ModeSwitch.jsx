import styles from './ModeSwitch.module.css';

export default function ModeSwitch({ mode, onChange, disabled }) {
  return (
    <div className={styles.wrap} role="tablist" aria-label="Editor mode">
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'merge'}
        className={`${styles.tab} ${mode === 'merge' ? styles.isActive : ''}`}
        onClick={() => onChange('merge')}
        disabled={disabled}
      >
        ⊞ Merge
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'extract'}
        className={`${styles.tab} ${mode === 'extract' ? styles.isActive : ''}`}
        onClick={() => onChange('extract')}
        disabled={disabled}
      >
        ✂ Extract
      </button>
    </div>
  );
}
