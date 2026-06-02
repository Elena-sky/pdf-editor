const timeout = require('connect-timeout');
const { sendError } = require('../lib/sendError');
const { REQUEST_TIMEOUT_MS } = require('../config/security');

const heavyRequestTimeout = timeout(`${REQUEST_TIMEOUT_MS}ms`);

function haltOnTimedout(req, res, next) {
  if (!req.timedout) {
    next();
    return;
  }
  if (!res.headersSent) {
    void sendError(res, 503, 'Request timed out');
  }
}

module.exports = { heavyRequestTimeout, haltOnTimedout };
