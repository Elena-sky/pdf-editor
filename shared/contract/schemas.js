import { z } from 'zod';

export const UploadConfigSchema = z.object({
  maxFileSizeMb: z.number().positive(),
  maxFiles: z.number().int().positive(),
  acceptedMime: z.literal('application/pdf'),
});

export const PreviewMetaSchema = z.object({
  fileName: z.string(),
  pageCount: z.number().int().nonnegative(),
  fileSize: z.number().int().nonnegative(),
});

export const ErrorBodySchema = z.object({
  error: z.string(),
});

export const SplitBodySchema = z.object({
  from: z.coerce.number().int().min(1),
  to: z.coerce.number().int().min(1),
});
