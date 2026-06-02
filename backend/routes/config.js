const express = require('express');
const {
  MAX_FILE_SIZE_MB,
  MAX_FILES,
} = require('../config/limits');

const router = express.Router();

/**
 * GET /api/config
 * Public upload limits (enforcement remains in multer middleware).
 */
router.get('/config', (req, res) => {
  res.json({
    maxFileSizeMb: MAX_FILE_SIZE_MB,
    maxFiles: MAX_FILES,
    acceptedMime: 'application/pdf',
  });
});

module.exports = router;
