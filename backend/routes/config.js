const express = require('express');
const {
  MAX_FILE_SIZE_MB,
  MAX_FILES,
} = require('../config/limits');
const { getContract } = require('../lib/contract');

const router = express.Router();

/**
 * GET /api/config
 * Public upload limits (enforcement remains in multer middleware).
 */
router.get('/config', async (req, res) => {
  const { UploadConfigSchema } = await getContract();
  res.json(
    UploadConfigSchema.parse({
      maxFileSizeMb: MAX_FILE_SIZE_MB,
      maxFiles: MAX_FILES,
      acceptedMime: 'application/pdf',
    }),
  );
});

/**
 * GET /api/openapi.json
 * OpenAPI 3 document generated from Zod schemas (runtime, no committed file).
 */
router.get('/openapi.json', async (req, res) => {
  const { buildOpenApiDocument } = await getContract();
  res.json(buildOpenApiDocument());
});

module.exports = router;
