import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModeSwitch from './ModeSwitch';

describe('ModeSwitch', () => {
  it('renders both tabs and highlights merge when mode is merge', () => {
    const onChange = vi.fn();
    render(<ModeSwitch mode="merge" onChange={onChange} />);
    const mergeTab = screen.getByRole('tab', { name: /Merge/i });
    const extractTab = screen.getByRole('tab', { name: /Extract/i });
    expect(mergeTab).toHaveAttribute('aria-selected', 'true');
    expect(extractTab).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onChange with extract when extract tab is clicked', () => {
    const onChange = vi.fn();
    render(<ModeSwitch mode="merge" onChange={onChange} />);
    fireEvent.click(screen.getByRole('tab', { name: /Extract/i }));
    expect(onChange).toHaveBeenCalledWith('extract');
  });

  it('disables both tabs when disabled', () => {
    render(<ModeSwitch mode="merge" onChange={() => {}} disabled />);
    expect(screen.getByRole('tab', { name: /Merge/i })).toBeDisabled();
    expect(screen.getByRole('tab', { name: /Extract/i })).toBeDisabled();
  });
});
