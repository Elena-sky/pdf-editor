import {
  MAX_FILE_SIZE as DEFAULT_MAX_FILE_SIZE,
  maxFileSizeLabel as defaultMaxFileSizeLabel,
} from '../config/limits';

const PDF_MIME = 'application/pdf';

/**
 * Client-side PDF upload check (UX only; server enforces limits).
 * @param {File} file
 * @param {{ maxFileSize?: number, maxFileSizeLabel?: string }} [opts]
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validatePdfFile(file, opts = {}) {
  const maxFileSize = opts.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;
  const sizeLabel = opts.maxFileSizeLabel ?? defaultMaxFileSizeLabel;

  if (file.type !== PDF_MIME) {
    return { ok: false, error: `"${file.name}" — not a PDF file` };
  }
  if (file.size > maxFileSize) {
    return { ok: false, error: `"${file.name}" exceeds ${sizeLabel} limit` };
  }
  return { ok: true };
}

export function validatePdfFileExtract(file, opts = {}) {
  const maxFileSize = opts.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;
  const sizeLabel = opts.maxFileSizeLabel ?? defaultMaxFileSizeLabel;

  if (file.type !== PDF_MIME) {
    return { ok: false, error: 'Not a PDF' };
  }
  if (file.size > maxFileSize) {
    return { ok: false, error: `File exceeds ${sizeLabel}` };
  }
  return { ok: true };
}
