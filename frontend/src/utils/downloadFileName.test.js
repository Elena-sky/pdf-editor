import { describe, it, expect } from 'vitest';
import {
  toDownloadFileName,
  sanitizeStemForFileName,
  DEFAULT_OUTPUT_NAME,
} from './downloadFileName.js';

describe('toDownloadFileName', () => {
  it('adds .pdf when missing and lowercases', () => {
    expect(toDownloadFileName('MyDoc')).toBe('MyDoc.pdf');
  });

  it('keeps existing .pdf (case-insensitive) without duplicating', () => {
    expect(toDownloadFileName('Report.PDF')).toBe('Report.PDF');
  });

  it('replaces illegal path characters with dash', () => {
    expect(toDownloadFileName('a/b?x')).toBe('a-b-x.pdf');
  });

  it('replaces spaces with underscores', () => {
    expect(toDownloadFileName('my report name')).toBe('my_report_name.pdf');
    expect(toDownloadFileName('a  b')).toBe('a_b.pdf');
  });

  it('uses default name for empty or whitespace', () => {
    expect(toDownloadFileName('')).toBe(`${DEFAULT_OUTPUT_NAME}.pdf`);
    expect(toDownloadFileName('   ')).toBe(`${DEFAULT_OUTPUT_NAME}.pdf`);
  });

  it('strips leading dots from base', () => {
    expect(toDownloadFileName('..hidden')).toBe('hidden.pdf');
  });
});

describe('sanitizeStemForFileName', () => {
  it('strips .pdf and normalizes like download stem', () => {
    expect(sanitizeStemForFileName('My File.pdf')).toBe('My_File');
    expect(sanitizeStemForFileName('a/b c.pdf')).toBe('a-b_c');
  });
});
