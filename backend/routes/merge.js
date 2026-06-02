const express = require('express');
const { PDFDocument } = require('pdf-lib');
const { upload, MAX_FILES } = require('../middleware/upload');
const { getContract } = require('../lib/contract');
const { sendError } = require('../lib/sendError');

const router = express.Router();

/**
 * POST /api/merge-pdf
 * Merges multiple uploaded PDF files into one.
 * Files are merged in the order provided by the "order" field.
 */
router.post('/merge-pdf', upload.array('files', MAX_FILES), async (req, res) => {
  try {
    if (!req.files || req.files.length < 2) {
      return sendError(res, 400, 'Please upload at least 2 PDF files');
    }

    // Determine merge order (frontend sends comma-separated indices)
    let orderedFiles = req.files;
    if (req.body.order) {
      const order = req.body.order.split(',').map(Number);
      orderedFiles = order.map((idx) => req.files[idx]).filter(Boolean);
    }

    const mergedPdf = await PDFDocument.create();

    for (const file of orderedFiles) {
      let srcDoc;
      try {
        srcDoc = await PDFDocument.load(file.buffer, {
          ignoreEncryption: false,
        });
      } catch (e) {
        return sendError(
          res,
          422,
          `Failed to parse "${file.originalname}": ${e.message}. File may be corrupted or encrypted.`,
        );
      }

      const pages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="merged.pdf"',
      'Content-Length': mergedBytes.length,
    });

    res.send(Buffer.from(mergedBytes));
  } catch (err) {
    console.error('Merge error:', err);
    return sendError(res, 500, err.message || 'Failed to merge PDFs');
  }
});

/**
 * POST /api/preview-pdf
 * Returns metadata (page count, file name) for an uploaded PDF.
 * The actual page rendering happens on the frontend via pdf.js.
 */
router.post('/preview-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'No file provided');
    }

    const doc = await PDFDocument.load(req.file.buffer, { ignoreEncryption: false });
    const { PreviewMetaSchema } = await getContract();

    res.json(
      PreviewMetaSchema.parse({
        fileName: req.file.originalname,
        pageCount: doc.getPageCount(),
        fileSize: req.file.size,
      }),
    );
  } catch (err) {
    return sendError(res, 422, `Invalid PDF: ${err.message}`);
  }
});

module.exports = router;
