import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme/theme';
import StatTile from './StatTile';

function renderTile(props: Parameters<typeof StatTile>[0]) {
  return render(
    <ThemeProvider theme={theme}>
      <StatTile {...props} />
    </ThemeProvider>,
  );
}

describe('StatTile', () => {
  it('announces as one unit "<label>: <value>" and shows both visually', () => {
    renderTile({ label: 'Overdue', value: 3, tone: 'error' });
    const tile = screen.getByRole('img', { name: 'Overdue: 3' });
    expect(within(tile).getByText('3')).toBeInTheDocument();
    expect(within(tile).getByText('Overdue')).toBeInTheDocument();
  });

  it('carries a tone icon so meaning is never color-alone (INV-6)', () => {
    const { container } = renderTile({ label: 'On track', value: 2, tone: 'success' });
    // The decorative tone icon renders as an SVG inside the tile.
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('defaults to a neutral tone', () => {
    renderTile({ label: 'Done', value: 1 });
    expect(screen.getByRole('img', { name: 'Done: 1' })).toBeInTheDocument();
  });
});
