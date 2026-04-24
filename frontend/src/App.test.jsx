import { describe, it, expect } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the title and drop area in merge mode', () => {
    render(<App />);
    expect(screen.getByText('PDF Merger')).toBeInTheDocument();
    expect(
      screen.getByText('Combine multiple PDF files into one — fast and private')
    ).toBeInTheDocument();
  });

  it('shows output name with default merged', () => {
    render(<App />);
    expect(screen.getByLabelText('Output file name', { exact: true })).toHaveValue('merged');
  });

  it('defaults to merge and switches to extract and back', () => {
    render(<App />);
    expect(screen.getByText('PDF Merger')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Extract/i }));
    expect(screen.getByText('PDF Extractor')).toBeInTheDocument();
    expect(
      screen.getByText('Extract a page range from a PDF into a new file')
    ).toBeInTheDocument();
    expect(screen.getByText('Drop a PDF file to extract pages')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Merge/i }));
    expect(screen.getByText('PDF Merger')).toBeInTheDocument();
    expect(screen.getByLabelText('Output file name', { exact: true })).toHaveValue('merged');
  });

  it('keeps merge file list when toggling to extract and back', async () => {
    const pdf1 = new File([new ArrayBuffer(8)], 'a.pdf', { type: 'application/pdf' });
    const pdf2 = new File([new ArrayBuffer(8)], 'b.pdf', { type: 'application/pdf' });
    render(<App />);
    const merge = screen.getByTestId('merge-view-root');
    const input = merge.querySelector('input[type="file"]');
    expect(input).toBeTruthy();
    fireEvent.change(input, { target: { files: [pdf1, pdf2] } });
    expect(
      await within(merge).findByRole('button', { name: /Merge 2 PDFs/ })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Extract/i }));
    expect(screen.getByText('PDF Extractor')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Merge/i }));
    const merge2 = screen.getByTestId('merge-view-root');
    await waitFor(() => {
      expect(
        within(merge2).getByRole('button', { name: /Merge 2 PDFs/ })
      ).toBeInTheDocument();
    });
  });
});
