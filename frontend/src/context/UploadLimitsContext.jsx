import { useEffect, useMemo, useState } from 'react';
import { getBuildTimeUploadLimits, maxFileSizeLabelFromMb } from '../config/limits';
import { UploadLimitsContext } from './uploadLimitsContext';

function limitsFromApi(data) {
  const maxFileSizeMb = data.maxFileSizeMb;
  const maxFiles = data.maxFiles;
  return {
    maxFileSizeMb,
    maxFiles,
    maxFileSize: maxFileSizeMb * 1024 * 1024,
    maxFileSizeLabel: maxFileSizeLabelFromMb(maxFileSizeMb),
    acceptedMime: data.acceptedMime,
  };
}

export function UploadLimitsProvider({ children }) {
  const [limits, setLimits] = useState(getBuildTimeUploadLimits);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/config');
        if (!res.ok) return;
        const data = await res.json();
        if (
          cancelled ||
          !Number.isFinite(data.maxFileSizeMb) ||
          !Number.isInteger(data.maxFiles) ||
          data.maxFiles <= 0
        ) {
          return;
        }
        setLimits(limitsFromApi(data));
      } catch {
        // keep build-time defaults
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ ...limits, ready }), [limits, ready]);

  return (
    <UploadLimitsContext.Provider value={value}>{children}</UploadLimitsContext.Provider>
  );
}
