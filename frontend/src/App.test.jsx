import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the title and drop area', () => {
    render(<App />);
    expect(screen.getByText('PDF Merger')).toBeInTheDocument();
    expect(
      screen.getByText('Combine multiple PDF files into one — fast and private')
    ).toBeInTheDocument();
  });
});
