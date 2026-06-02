const { sendError } = require('../lib/sendError');
const { MAX_CONCURRENT_HEAVY } = require('../config/security');

let activeHeavy = 0;

function createHeavyConcurrencyMiddleware(maxConcurrent = MAX_CONCURRENT_HEAVY) {
  return async function heavyConcurrency(req, res, next) {
    if (activeHeavy >= maxConcurrent) {
      await sendError(res, 503, 'Server busy, try again later');
      return;
    }

    activeHeavy += 1;
    let released = false;

    const release = () => {
      if (released) {
        return;
      }
      released = true;
      activeHeavy -= 1;
    };

    res.on('finish', release);
    res.on('close', release);
    next();
  };
}

const heavyConcurrency = createHeavyConcurrencyMiddleware();

function resetHeavyConcurrencyForTests() {
  activeHeavy = 0;
}

module.exports = {
  heavyConcurrency,
  createHeavyConcurrencyMiddleware,
  resetHeavyConcurrencyForTests,
};
