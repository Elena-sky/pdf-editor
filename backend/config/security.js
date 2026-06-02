function parsePositiveInt(raw, name, fallback) {
  if (raw === undefined || raw === '') {
    return fallback;
  }
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`Invalid ${name}: ${raw}`);
  }
  return n;
}

const RATE_LIMIT_WINDOW_MS = parsePositiveInt(
  process.env.RATE_LIMIT_WINDOW_MS,
  'RATE_LIMIT_WINDOW_MS',
  900000,
);

const RATE_LIMIT_MAX = parsePositiveInt(
  process.env.RATE_LIMIT_MAX,
  'RATE_LIMIT_MAX',
  60,
);

const RATE_LIMIT_HEAVY_MAX = parsePositiveInt(
  process.env.RATE_LIMIT_HEAVY_MAX,
  'RATE_LIMIT_HEAVY_MAX',
  10,
);

const REQUEST_TIMEOUT_MS = parsePositiveInt(
  process.env.REQUEST_TIMEOUT_MS,
  'REQUEST_TIMEOUT_MS',
  120000,
);

const MAX_CONCURRENT_HEAVY = parsePositiveInt(
  process.env.MAX_CONCURRENT_HEAVY,
  'MAX_CONCURRENT_HEAVY',
  2,
);

module.exports = {
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
  RATE_LIMIT_HEAVY_MAX,
  REQUEST_TIMEOUT_MS,
  MAX_CONCURRENT_HEAVY,
};
