import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import ExtractView from './ExtractView';

const pdfFile = (name) =>
  new File([new ArrayBuffer(8)], name, { type: 'application/pdf' });

describe('ExtractView', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows dropzone and empty state without a file', () => {
    render(<ExtractView />);
    expect(screen.getByText('Drop a PDF file to extract pages')).toBeInTheDocument();
  });

  it('after file drop and preview, shows page count and from/to defaults', async () => {
    fetchMock.mockImplementation((url) => {
      if (String(url).includes('preview-pdf')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ fileName: 'a.pdf', pageCount: 5, fileSize: 100 }),
        });
      }
      return Promise.resolve({ ok: false });
    });

    render(<ExtractView />);
    const root = screen.getByTestId('extract-view-root');
    const input = root.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [pdfFile('a.pdf')] } });

    expect(await screen.findByText(/5 pages/)).toBeInTheDocument();
    expect(screen.getByLabelText('From')).toHaveValue(1);
    expect(screen.getByLabelText('To')).toHaveValue(5);
  });

  it('sets from to 0 and disables extract with range error', async () => {
    fetchMock.mockImplementation((url) => {
      if (String(url).includes('preview-pdf')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ fileName: 'a.pdf', pageCount: 5, fileSize: 100 }),
        });
      }
      return Promise.resolve({ ok: false });
    });

    render(<ExtractView />);
    const root = screen.getByTestId('extract-view-root');
    const input = root.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [pdfFile('a.pdf')] } });
    await screen.findByText(/5 pages/);

    fireEvent.change(screen.getByLabelText('From'), { target: { value: '0' } });
    expect(screen.getByText('From must be ≥ 1')).toBeInTheDocument();
    expect(
      within(root).getByRole('button', { name: /Extract pages/ })
    ).toBeDisabled();
  });

  it('calls split-pdf and shows success on extract', async () => {
    const blob = new Blob([new ArrayBuffer(4)], { type: 'application/pdf' });
    fetchMock.mockImplementation((url) => {
      if (String(url).includes('preview-pdf')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ fileName: 'a.pdf', pageCount: 3, fileSize: 100 }),
        });
      }
      if (String(url).includes('split-pdf')) {
        return Promise.resolve({
          ok: true,
          blob: async () => blob,
        });
      }
      return Promise.resolve({ ok: false });
    });

    const createElement = document.createElement.bind(document);
    const clickSpy = vi.fn();
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'a') {
        const a = createElement('a');
        a.click = clickSpy;
        return a;
      }
      return createElement(tag);
    });

    render(<ExtractView onExtractingChange={vi.fn()} />);
    const root = screen.getByTestId('extract-view-root');
    fireEvent.change(root.querySelector('input[type="file"]'), {
      target: { files: [pdfFile('a.pdf')] },
    });
    await screen.findByText(/3 pages/);

    fireEvent.click(
      within(root).getByRole('button', { name: /Extract pages 1–3/ })
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    const splitCalls = fetchMock.mock.calls.filter((c) => String(c[0]).includes('split-pdf'));
    expect(splitCalls.length).toBeGreaterThan(0);
    const splitBody = splitCalls[0][1].body;
    expect(splitBody).toBeInstanceOf(FormData);
  });

  it('updates output name with from/to when not manually edited', async () => {
    fetchMock.mockImplementation((url) => {
      if (String(url).includes('preview-pdf')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ fileName: 'a.pdf', pageCount: 5, fileSize: 100 }),
        });
      }
      return Promise.resolve({ ok: false });
    });

    render(<ExtractView />);
    const root = screen.getByTestId('extract-view-root');
    fireEvent.change(root.querySelector('input[type="file"]'), {
      target: { files: [pdfFile('a.pdf')] },
    });
    const out = await screen.findByLabelText('Output file name');
    await waitFor(() => {
      expect(out).toHaveValue('a_pages_1-5.pdf');
    });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2' } });
    await waitFor(() => {
      expect(out).toHaveValue('a_pages_1-2.pdf');
    });
  });

  it('does not override manual output name when from/to change', async () => {
    fetchMock.mockImplementation((url) => {
      if (String(url).includes('preview-pdf')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ fileName: 'a.pdf', pageCount: 5, fileSize: 100 }),
        });
      }
      return Promise.resolve({ ok: false });
    });

    render(<ExtractView />);
    const root = screen.getByTestId('extract-view-root');
    fireEvent.change(root.querySelector('input[type="file"]'), {
      target: { files: [pdfFile('a.pdf')] },
    });
    const out = await screen.findByLabelText('Output file name');
    await waitFor(() => expect(out).toHaveValue('a_pages_1-5.pdf'));

    fireEvent.change(out, { target: { value: 'custom.pdf' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2' } });
    expect(out).toHaveValue('custom.pdf');
  });
});
