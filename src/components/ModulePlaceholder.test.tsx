import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ModulePlaceholder from './ModulePlaceholder';

describe('ModulePlaceholder', () => {
  it('renders the title as a heading and the note', () => {
    render(<ModulePlaceholder title="Rocks" note="Arriving in M2." />);
    expect(screen.getByRole('heading', { name: 'Rocks' })).toBeInTheDocument();
    expect(screen.getByText('Arriving in M2.')).toBeInTheDocument();
  });
});
