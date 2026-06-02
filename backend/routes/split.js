const express = require('express');
const { PDFDocument } = require('pdf-lib');
const { upload } = require('../middleware/upload');
const { getContract } = require('../lib/contract');
const { sendError, formatZodError } = require('../lib/sendError');

const router = express.Router();

/**
 * POST /api/split-pdf
 * Extracts page range [from..to] (1-based, inclusive) from uploaded PDF.
 */
router.post('/split-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'No file provided');
    }

    const { SplitBodySchema } = await getContract();
    const parsed = SplitBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, formatZodError(parsed.error));
    }
    const { from, to } = parsed.data;

    let srcDoc;
    try {
      srcDoc = await PDFDocument.load(req.file.buffer, { ignoreEncryption: false });
    } catch (e) {
      return sendError(
        res,
        422,
        `Failed to parse "${req.file.originalname}": ${e.message}`,
      );
    }

    const pageCount = srcDoc.getPageCount();

    if (from < 1 || from > pageCount) {
      return sendError(res, 400, `"from" must be between 1 and ${pageCount}`);
    }
    if (to < 1 || to > pageCount) {
      return sendError(res, 400, `"to" must be between 1 and ${pageCount}`);
    }
    if (from > to) {
      return sendError(res, 400, '"from" must be ≤ "to"');
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
    return sendError(res, 500, err.message || 'Failed to split PDF');
  }
});

module.exports = router;
