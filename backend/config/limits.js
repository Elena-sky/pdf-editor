const DEFAULT_MAX_FILE_SIZE_MB = 100;
const MAX_FILES = 20;

function parseMaxFileSizeMb() {
  const raw = process.env.MAX_FILE_SIZE_MB;
  if (raw === undefined || raw === '') {
    return DEFAULT_MAX_FILE_SIZE_MB;
  }
  const mb = Number(raw);
  if (!Number.isFinite(mb) || mb <= 0) {
    throw new Error(`Invalid MAX_FILE_SIZE_MB: ${raw}`);
  }
  return mb;
}

const MAX_FILE_SIZE_MB = parseMaxFileSizeMb();
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_UPLOAD_BODY_MB = MAX_FILE_SIZE_MB * MAX_FILES;

module.exports = {
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_MB,
  MAX_FILES,
  MAX_UPLOAD_BODY_MB,
};
