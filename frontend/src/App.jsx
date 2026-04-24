import { useState } from 'react';
import ModeSwitch from './components/ModeSwitch';
import MergeView from './components/MergeView';
import ExtractView from './components/ExtractView';
import styles from './App.module.css';

export default function App() {
  const [mode, setMode] = useState('merge');
  const [mergeBusy, setMergeBusy] = useState(false);
  const [extractBusy, setExtractBusy] = useState(false);

  return (
    <div className={styles.app} data-mode={mode}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>{mode === 'merge' ? '⊞' : '✂'}</span>
          <span>{mode === 'merge' ? 'PDF Merger' : 'PDF Extractor'}</span>
        </div>
        <p className={styles.subtitle}>
          {mode === 'merge'
            ? 'Combine multiple PDF files into one — fast and private'
            : 'Extract a page range from a PDF into a new file'}
        </p>
        <ModeSwitch
          mode={mode}
          onChange={setMode}
          disabled={mergeBusy || extractBusy}
        />
      </header>

      <main className={styles.main}>
        <div
          className={styles.viewPane}
          data-hidden={mode !== 'merge'}
          hidden={mode !== 'merge'}
        >
          <MergeView onMergingChange={setMergeBusy} />
        </div>
        <div
          className={styles.viewPane}
          data-hidden={mode !== 'extract'}
          hidden={mode !== 'extract'}
        >
          <ExtractView onExtractingChange={setExtractBusy} />
        </div>
      </main>
    </div>
  );
}
