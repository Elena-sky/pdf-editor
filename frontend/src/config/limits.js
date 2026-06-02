const DEFAULT_MAX_FILE_SIZE_MB = 100;
const DEFAULT_MAX_FILES = 20;
export const ACCEPTED_PDF_MIME = 'application/pdf';

function parseMaxFileSizeMb() {
  const raw = import.meta.env.VITE_MAX_FILE_SIZE_MB;
  if (raw === undefined || raw === '') return DEFAULT_MAX_FILE_SIZE_MB;
  const mb = Number(raw);
  if (!Number.isFinite(mb) || mb <= 0) return DEFAULT_MAX_FILE_SIZE_MB;
  return mb;
}

function parseMaxFiles() {
  const raw = import.meta.env.VITE_MAX_FILES;
  if (raw === undefined || raw === '') return DEFAULT_MAX_FILES;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) return DEFAULT_MAX_FILES;
  return n;
}

export const MAX_FILE_SIZE_MB = parseMaxFileSizeMb();
export const MAX_FILES = parseMaxFiles();
export const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

export function maxFileSizeLabelFromMb(mb) {
  return `${mb} MB`;
}

export const maxFileSizeLabel = maxFileSizeLabelFromMb(MAX_FILE_SIZE_MB);

/** Build-time defaults; may be overridden by GET /api/config at runtime. */
export function getBuildTimeUploadLimits() {
  return {
    maxFileSizeMb: MAX_FILE_SIZE_MB,
    maxFiles: MAX_FILES,
    maxFileSize: MAX_FILE_SIZE,
    maxFileSizeLabel: maxFileSizeLabelFromMb(MAX_FILE_SIZE_MB),
    acceptedMime: ACCEPTED_PDF_MIME,
  };
}
