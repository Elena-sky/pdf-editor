const express = require('express');
const { PDFDocument } = require('pdf-lib');
const { upload } = require('../middleware/upload');

const router = express.Router();

/**
 * POST /api/split-pdf
 * Extracts page range [from..to] (1-based, inclusive) from uploaded PDF.
 */
router.post('/split-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const from = parseInt(req.body.from, 10);
    const to = parseInt(req.body.to, 10);

    if (!Number.isInteger(from) || !Number.isInteger(to)) {
      return res.status(400).json({ error: '"from" and "to" must be integers' });
    }

    let srcDoc;
    try {
      srcDoc = await PDFDocument.load(req.file.buffer, { ignoreEncryption: false });
    } catch (e) {
      return res.status(422).json({
        error: `Failed to parse "${req.file.originalname}": ${e.message}`,
      });
    }

    const pageCount = srcDoc.getPageCount();

    if (from < 1 || from > pageCount) {
      return res.status(400).json({ error: `"from" must be between 1 and ${pageCount}` });
    }
    if (to < 1 || to > pageCount) {
      return res.status(400).json({ error: `"to" must be between 1 and ${pageCount}` });
    }
    if (from > to) {
      return res.status(400).json({ error: '"from" must be ≤ "to"' });
    }

    const outDoc = await PDFDocument.create();
    const indices = Array.from({ length: to - from + 1 }, (_, i) => from - 1 + i);
    const pages = await outDoc.copyPages(srcDoc, indices);
    pages.forEach((p) => outDoc.addPage(p));

    const bytes = await outDoc.save();

    const base = (req.file.originalname || 'document').replace(/\.pdf$/i, '');
    const safeBase = base.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_');
    const outputName = `${safeBase}_pages_${from}-${to}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${outputName}"`,
      'Content-Length': bytes.length,
    });
    res.send(Buffer.from(bytes));
  } catch (err) {
    console.error('Split error:', err);
    res.status(500).json({ error: err.message || 'Failed to split PDF' });
  }
});

module.exports = router;
