process.env.RATE_LIMIT_MAX = '2';
process.env.RATE_LIMIT_HEAVY_MAX = '2';
process.env.MAX_CONCURRENT_HEAVY = '1';

const assert = require('assert');
const { describe, test, beforeEach } = require('node:test');
const request = require('supertest');
const {
  createHeavyConcurrencyMiddleware,
  resetHeavyConcurrencyForTests,
} = require('./middleware/heavyConcurrency');
const app = require('./server');

function mockRes() {
  const listeners = { finish: [], close: [] };
  return {
    headersSent: false,
    statusCode: null,
    body: null,
    on(event, fn) {
      listeners[event].push(fn);
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    emitFinish() {
      for (const fn of listeners.finish) {
        fn();
      }
    },
  };
}

describe('heavyConcurrency middleware', () => {
  beforeEach(() => {
    resetHeavyConcurrencyForTests();
  });

  test('returns 503 when concurrent heavy limit exceeded', async () => {
    const mw = createHeavyConcurrencyMiddleware(1);
    const res1 = mockRes();
    let next1 = false;
    await mw({}, res1, () => {
      next1 = true;
    });
    assert.strictEqual(next1, true);

    const res2 = mockRes();
    let next2 = false;
    await mw({}, res2, () => {
      next2 = true;
    });
    assert.strictEqual(next2, false);
    assert.strictEqual(res2.statusCode, 503);
    assert.strictEqual(res2.body.error, 'Server busy, try again later');
  });
});

describe('API rate limits', () => {
  test('GET /api/config returns 429 after limit exceeded', async () => {
    await request(app).get('/api/config').expect(200);
    await request(app).get('/api/config').expect(200);
    const res = await request(app).get('/api/config').expect(429);
    assert.strictEqual(res.body.error, 'Too many requests');
  });
});
