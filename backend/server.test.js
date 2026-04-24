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
