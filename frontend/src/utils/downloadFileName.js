const DEFAULT_OUTPUT_NAME = 'merged';

/**
 * @param {string} raw
 * @returns {string} filename ending in .pdf, safe for download
 */
export function toDownloadFileName(raw) {
  const trimmed = (raw || '').trim() || DEFAULT_OUTPUT_NAME;
  const noIllegal = trimmed
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\0/g, '')
    .replace(/\s+/g, '_');
  const base = (noIllegal || DEFAULT_OUTPUT_NAME).replace(/^\.+/, '') || DEFAULT_OUTPUT_NAME;
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`;
}

/**
 * Strips .pdf, applies the same character rules as download files (stems in auto-suggested names).
 * @param {string} name
 * @returns {string}
 */
export function sanitizeStemForFileName(name) {
  const noExt = (name || '').replace(/\.pdf$/i, '');
  return noExt
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\0/g, '')
    .replace(/\s+/g, '_');
}

export { DEFAULT_OUTPUT_NAME };
