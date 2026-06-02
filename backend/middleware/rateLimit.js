const rateLimit = require('express-rate-limit');
const { sendError } = require('../lib/sendError');
const {
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
  RATE_LIMIT_HEAVY_MAX,
} = require('../config/security');

async function rateLimitHandler(req, res) {
  await sendError(res, 429, 'Too many requests');
}

const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const heavyRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_HEAVY_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

module.exports = { apiRateLimiter, heavyRateLimiter };
