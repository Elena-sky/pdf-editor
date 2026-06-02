const DEFAULT_CORS_ORIGIN = 'http://localhost:5173';

/**
 * @returns {string[] | null} Allowed origins, or null to disable CORS middleware.
 */
function parseCorsOrigins() {
  if (process.env.CORS_ORIGIN === '') {
    return null;
  }
  const raw = process.env.CORS_ORIGIN ?? DEFAULT_CORS_ORIGIN;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function getCorsOptions() {
  const origins = parseCorsOrigins();
  if (!origins) {
    return null;
  }
  return {
    origin(origin, callback) {
      if (!origin || origins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
  };
}

module.exports = { parseCorsOrigins, getCorsOptions, DEFAULT_CORS_ORIGIN };
