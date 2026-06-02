import { apiBlob, apiJson } from './client';

export function mergePdf(formData) {
  return apiBlob('/merge-pdf', { method: 'POST', body: formData });
}

export function previewPdf(formData) {
  return apiJson('/preview-pdf', { method: 'POST', body: formData });
}

export function splitPdf(formData) {
  return apiBlob('/split-pdf', { method: 'POST', body: formData });
}

export function fetchConfig() {
  return apiJson('/config');
}
