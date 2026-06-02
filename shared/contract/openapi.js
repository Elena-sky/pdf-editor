import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  ErrorBodySchema,
  PreviewMetaSchema,
  UploadConfigSchema,
} from './schemas.js';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const UploadConfig = registry.register('UploadConfig', UploadConfigSchema);
const PreviewMeta = registry.register('PreviewMeta', PreviewMetaSchema);
const ErrorBody = registry.register('ErrorBody', ErrorBodySchema);

const errorResponse = {
  description: 'Error',
  content: {
    'application/json': {
      schema: ErrorBody,
    },
  },
};

const pdfResponse = {
  description: 'PDF file',
  content: {
    'application/pdf': {
      schema: {
        type: 'string',
        format: 'binary',
      },
    },
  },
};

registry.registerPath({
  method: 'get',
  path: '/config',
  summary: 'Upload limits for clients',
  operationId: 'getConfig',
  responses: {
    200: {
      description: 'Active limits',
      content: {
        'application/json': {
          schema: UploadConfig,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/merge-pdf',
  summary: 'Merge PDF files',
  operationId: 'mergePdf',
  request: {
    body: {
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            required: ['files'],
            properties: {
              files: {
                type: 'array',
                items: { type: 'string', format: 'binary' },
                description: '2–20 PDF files (see server MAX_FILES)',
              },
              order: {
                type: 'string',
                description: 'Comma-separated indices for merge order',
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: pdfResponse,
    400: errorResponse,
    422: errorResponse,
    500: errorResponse,
  },
});

registry.registerPath({
  method: 'post',
  path: '/preview-pdf',
  summary: 'PDF metadata (page count)',
  operationId: 'previewPdf',
  request: {
    body: {
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            required: ['file'],
            properties: {
              file: { type: 'string', format: 'binary' },
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Metadata',
      content: {
        'application/json': {
          schema: PreviewMeta,
        },
      },
    },
    400: errorResponse,
    422: errorResponse,
    500: errorResponse,
  },
});

registry.registerPath({
  method: 'post',
  path: '/split-pdf',
  summary: 'Extract page range',
  operationId: 'splitPdf',
  request: {
    body: {
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            required: ['file', 'from', 'to'],
            properties: {
              file: { type: 'string', format: 'binary' },
              from: {
                type: 'integer',
                minimum: 1,
                description: 'Start page (1-based, inclusive)',
              },
              to: {
                type: 'integer',
                minimum: 1,
                description: 'End page (1-based, inclusive)',
              },
            },
          },
        },
      },
    },
  },
  responses: {
    200: pdfResponse,
    400: errorResponse,
    422: errorResponse,
    500: errorResponse,
  },
});

const API_DESCRIPTION = `Merge, preview, and split PDF uploads.

**Enforcement:** limits are applied by multer (\`application/pdf\` MIME, per-file size, merge file count).
Defaults: 100 MB per file, up to 20 files on merge. Configure via \`MAX_FILE_SIZE_MB\` on the backend.
\`GET /api/config\` returns the active limits for UI hints.`;

export function buildOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'PDF Editor API',
      version: '1.0.0',
      description: API_DESCRIPTION,
    },
    servers: [{ url: '/api', description: 'Same origin (proxied to backend in dev)' }],
  });
}
