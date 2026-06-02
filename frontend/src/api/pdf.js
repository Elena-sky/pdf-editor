import { PreviewMetaSchema, UploadConfigSchema } from '@pdf-editor/contract/schemas';
import { ApiError, apiBlob, apiJson } from './client';

export function mergePdf(formData) {
  return apiBlob('/merge-pdf', { method: 'POST', body: formData });
}

export function previewPdf(formData) {
  return apiJson('/preview-pdf', { method: 'POST', body: formData }).then((data) => {
    const parsed = PreviewMetaSchema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError('Invalid preview response from server', 502);
    }
    return parsed.data;
  });
}

export function splitPdf(formData) {
  return apiBlob('/split-pdf', { method: 'POST', body: formData });
}

export function fetchConfig() {
  return apiJson('/config').then((data) => {
    const parsed = UploadConfigSchema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError('Invalid config response from server', 502);
    }
    return parsed.data;
  });
}
