import { describe, it, expect } from 'vitest';
import { validatePdfFile, validatePdfFileExtract } from './validatePdfFile.js';

const pdf = (name, size, type = 'application/pdf') =>
  new File([new ArrayBuffer(size)], name, { type });

describe('validatePdfFile', () => {
  const limit = 100;
  const label = '100 MB';

  it('accepts a valid PDF within size limit', () => {
    expect(validatePdfFile(pdf('a.pdf', 50), { maxFileSize: limit, maxFileSizeLabel: label })).toEqual({
      ok: true,
    });
  });

  it('rejects non-PDF mime type', () => {
    const result = validatePdfFile(pdf('a.txt', 10, 'text/plain'), {
      maxFileSize: limit,
      maxFileSizeLabel: label,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('not a PDF');
  });

  it('rejects file over max size', () => {
    const result = validatePdfFile(pdf('big.pdf', 101), {
      maxFileSize: limit,
      maxFileSizeLabel: label,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain(label);
  });

  it('accepts file exactly at size limit', () => {
    expect(validatePdfFile(pdf('edge.pdf', 100), { maxFileSize: limit, maxFileSizeLabel: label })).toEqual({
      ok: true,
    });
  });
});

describe('validatePdfFileExtract', () => {
  it('uses shorter error messages for extract flow', () => {
    expect(validatePdfFileExtract(pdf('x.txt', 1, 'text/plain'), { maxFileSize: 100, maxFileSizeLabel: '100 MB' })).toEqual({
      ok: false,
      error: 'Not a PDF',
    });
  });
});
