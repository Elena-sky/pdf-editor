import { useContext } from 'react';
import { UploadLimitsContext } from '../context/uploadLimitsContext';
import { getBuildTimeUploadLimits } from '../config/limits';

export function useUploadLimits() {
  const ctx = useContext(UploadLimitsContext);
  if (!ctx) {
    return { ...getBuildTimeUploadLimits(), ready: true };
  }
  return ctx;
}
