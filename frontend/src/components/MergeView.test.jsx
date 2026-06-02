import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import MergeView from './MergeView';
import { mergePdf } from '../api/pdf';
import { triggerBlobDownload } from '../utils/triggerDownload';

vi.mock('../api/pdf');
vi.mock('../utils/triggerDownload', () => ({
  triggerBlobDownload: vi.fn(),
}));

const pdfFile = (name) =>
  new File([new ArrayBuffer(8)], name, { type: 'application/pdf' });

describe('MergeView', () => {
  beforeEach(() => {
    vi.mocked(mergePdf).mockReset();
  });

  it('shows error when merge fails', async () => {
    vi.mocked(mergePdf).mockRejectedValue(new Error('Merge failed'));

    render(<MergeView />);
    const root = screen.getByTestId('merge-view-root');
    fireEvent.change(root.querySelector('input[type="file"]'), {
      target: { files: [pdfFile('a.pdf'), pdfFile('b.pdf')] },
    });
    await within(root).findByRole('button', { name: /Merge 2 PDFs/ });
    fireEvent.click(screen.getByRole('button', { name: /Merge 2 PDFs/ }));

    expect(await screen.findByText('Merge failed')).toBeInTheDocument();
  });

  it('calls mergePdf, triggers download, and shows success on merge', async () => {
    const blob = new Blob([new ArrayBuffer(4)], { type: 'application/pdf' });
    vi.mocked(mergePdf).mockResolvedValue(blob);

    render(<MergeView />);
    const root = screen.getByTestId('merge-view-root');
    fireEvent.change(root.querySelector('input[type="file"]'), {
      target: { files: [pdfFile('a.pdf'), pdfFile('b.pdf')] },
    });
    fireEvent.click(await within(root).findByRole('button', { name: /Merge 2 PDFs/ }));

    await waitFor(() => {
      expect(mergePdf).toHaveBeenCalledOnce();
      expect(triggerBlobDownload).toHaveBeenCalledWith(blob, 'merged.pdf');
    });
    expect(
      await screen.findByText(/merged\.pdf downloaded successfully/)
    ).toBeInTheDocument();
  });
});
