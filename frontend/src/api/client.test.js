import { describe, it, expect, vi, afterEach } from 'vitest';
import { ApiError, apiUrl, parseApiError } from './client';

describe('apiUrl', () => {
  it('builds relative /api path when VITE_API_BASE is unset', () => {
    expect(apiUrl('/merge-pdf')).toBe('/api/merge-pdf');
  });

  it('normalizes path without leading slash', () => {
    expect(apiUrl('config')).toBe('/api/config');
  });

  it('prefixes VITE_API_BASE when set', async () => {
    vi.stubEnv('VITE_API_BASE', 'https://api.example.com');
    vi.resetModules();
    const { apiUrl: apiUrlWithBase } = await import('./client.js');
    expect(apiUrlWithBase('/merge-pdf')).toBe('https://api.example.com/api/merge-pdf');
    vi.unstubAllEnvs();
    vi.resetModules();
  });
});

describe('parseApiError', () => {
  it('throws ApiError with server message', async () => {
    const res = {
      status: 400,
      json: async () => ({ error: 'bad request' }),
    };
    await expect(parseApiError(res)).rejects.toSatisfy((err) => {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.message).toBe('bad request');
      expect(err.status).toBe(400);
      return true;
    });
  });

  it('falls back when JSON is invalid', async () => {
    const res = {
      status: 500,
      json: async () => {
        throw new Error('parse fail');
      },
    };
    await expect(parseApiError(res)).rejects.toThrow('Server error: 500');
  });

  it('falls back when body has no error field', async () => {
    const res = {
      status: 422,
      json: async () => ({}),
    };
    await expect(parseApiError(res)).rejects.toThrow('Server error: 422');
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});
