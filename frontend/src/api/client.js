const API_BASE = import.meta.env.VITE_API_BASE ?? '';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function apiUrl(path) {
  const segment = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}/api${segment}`;
}

export async function parseApiError(res) {
  const data = await res.json().catch(() => ({}));
  throw new ApiError(data.error || `Server error: ${res.status}`, res.status);
}

async function apiRequest(path, init) {
  const res = await fetch(apiUrl(path), init);
  if (!res.ok) await parseApiError(res);
  return res;
}

export async function apiJson(path, init) {
  const res = await apiRequest(path, init);
  return res.json();
}

export async function apiBlob(path, init) {
  const res = await apiRequest(path, init);
  return res.blob();
}
