const assert = require('assert');
const { describe, test, before } = require('node:test');
const request = require('supertest');
const { PDFDocument } = require('pdf-lib');
const app = require('./server');

async function onePagePdf() {
  const doc = await PDFDocument.create();
  doc.addPage();
  return Buffer.from(await doc.save());
}

async function nPagePdf(n) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < n; i++) {
    doc.addPage();
  }
  return Buffer.from(await doc.save());
}

describe('PDF Merger API', () => {
  let pdfA;
  let pdfB;

  before(async () => {
    [pdfA, pdfB] = await Promise.all([onePagePdf(), onePagePdf()]);
  });

  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health').expect(200);
    assert.deepStrictEqual(res.body, {
      status: 'ok',
      message: 'PDF Merger API is running',
    });
  });

  test('POST /api/merge-pdf rejects fewer than 2 files', async () => {
    const res = await request(app)
      .post('/api/merge-pdf')
      .attach('files', pdfA, 'a.pdf')
      .expect(400);
    assert(typeof res.body.error === 'string');
  });

  test('POST /api/merge-pdf merges two valid PDFs', async () => {
    const res = await request(app)
      .post('/api/merge-pdf')
      .field('order', '0,1')
      .attach('files', pdfA, 'a.pdf')
      .attach('files', pdfB, 'b.pdf')
      .expect(200);
    assert.match(res.headers['content-type'], /application\/pdf/);
    const merged = await PDFDocument.load(res.body);
    assert.strictEqual(merged.getPageCount(), 2);
  });

  test('POST /api/preview-pdf rejects when no file', async () => {
    const res = await request(app).post('/api/preview-pdf').expect(400);
    assert(typeof res.body.error === 'string');
  });

  test('POST /api/preview-pdf returns page count for a valid PDF', async () => {
    const res = await request(app)
      .post('/api/preview-pdf')
      .attach('file', pdfA, 'sample.pdf')
      .expect(200);
    assert.strictEqual(res.body.pageCount, 1);
    assert.strictEqual(res.body.fileName, 'sample.pdf');
  });
});

describe('PDF Split API', () => {
  let pdf5;

  before(async () => {
    pdf5 = await nPagePdf(5);
  });

  test('POST /api/split-pdf extracts page range 2-4 as 3 pages', async () => {
    const res = await request(app)
      .post('/api/split-pdf')
      .field('from', '2')
      .field('to', '4')
      .attach('file', pdf5, 'p.pdf')
      .expect(200);
    assert.match(res.headers['content-type'], /application\/pdf/);
    assert.match(
      res.headers['content-disposition'],
      /attachment; filename="p_pages_2-4\.pdf"/i
    );
    const out = await PDFDocument.load(res.body);
    assert.strictEqual(out.getPageCount(), 3);
  });

  test('POST /api/split-pdf rejects when no file', async () => {
    const res = await request(app)
      .post('/api/split-pdf')
      .field('from', '1')
      .field('to', '1')
      .expect(400);
    assert(res.body.error.includes('file') || res.body.error === 'No file provided');
  });

  test('POST /api/split-pdf rejects from=0', async () => {
    const res = await request(app)
      .post('/api/split-pdf')
      .field('from', '0')
      .field('to', '1')
      .attach('file', pdf5, 'p.pdf')
      .expect(400);
    assert.match(res.body.error, /from/);
  });

  test('POST /api/split-pdf rejects to=999 for 5-page doc', async () => {
    const res = await request(app)
      .post('/api/split-pdf')
      .field('from', '1')
      .field('to', '999')
      .attach('file', pdf5, 'p.pdf')
      .expect(400);
    assert.match(res.body.error, /to/);
  });

  test('POST /api/split-pdf rejects from > to', async () => {
    const res = await request(app)
      .post('/api/split-pdf')
      .field('from', '5')
      .field('to', '2')
      .attach('file', pdf5, 'p.pdf')
      .expect(400);
    assert.match(res.body.error, /from/);
  });

  test('POST /api/split-pdf rejects non-integer from', async () => {
    const res = await request(app)
      .post('/api/split-pdf')
      .field('from', 'x')
      .field('to', '1')
      .attach('file', pdf5, 'p.pdf')
      .expect(400);
    assert.strictEqual(res.body.error, '"from" and "to" must be integers');
  });

  test('POST /api/split-pdf returns 422 for invalid PDF', async () => {
    const res = await request(app)
      .post('/api/split-pdf')
      .field('from', '1')
      .field('to', '1')
      .attach('file', Buffer.from('not a pdf'), 'bad.pdf')
      .expect(422);
    assert(typeof res.body.error === 'string');
  });

  test('POST /api/split-pdf from=1 to=5 returns 5 pages', async () => {
    const res = await request(app)
      .post('/api/split-pdf')
      .field('from', '1')
      .field('to', '5')
      .attach('file', pdf5, 'p.pdf')
      .expect(200);
    const out = await PDFDocument.load(res.body);
    assert.strictEqual(out.getPageCount(), 5);
  });
});
