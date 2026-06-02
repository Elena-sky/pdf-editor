const { getContract } = require('./contract');

async function sendError(res, status, message) {
  const { ErrorBodySchema } = await getContract();
  return res.status(status).json(ErrorBodySchema.parse({ error: message }));
}

function formatZodError(err) {
  const first = err.errors?.[0];
  if (!first) {
    return 'Invalid request';
  }
  const path = first.path.length ? `${first.path.join('.')}: ` : '';
  return `${path}${first.message}`;
}

module.exports = { sendError, formatZodError };
