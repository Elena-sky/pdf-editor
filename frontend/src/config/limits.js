const DEFAULT_MAX_FILE_SIZE_MB = 100;

function parseMaxFileSizeMb() {
  const raw = import.meta.env.VITE_MAX_FILE_SIZE_MB;
  if (raw === undefined || raw === '') return DEFAULT_MAX_FILE_SIZE_MB;
  const mb = Number(raw);
  if (!Number.isFinite(mb) || mb <= 0) return DEFAULT_MAX_FILE_SIZE_MB;
  return mb;
}

export const MAX_FILE_SIZE_MB = parseMaxFileSizeMb();
export const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
export const maxFileSizeLabel = `${MAX_FILE_SIZE_MB} MB`;
