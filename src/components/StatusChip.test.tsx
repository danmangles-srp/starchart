import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme/theme';
import StatusChip from './StatusChip';
import { ROCK_STATUSES, ROCK_STATUS_META } from '@/theme/status';

describe('StatusChip', () => {
  it('renders every status as text + an icon (never color alone)', () => {
    for (const status of ROCK_STATUSES) {
      const { unmount, container } = render(
        <ThemeProvider theme={theme}>
          <StatusChip status={status} />
        </ThemeProvider>,
      );
      expect(screen.getByText(ROCK_STATUS_META[status].label)).toBeInTheDocument();
      // icon present → not color alone
      expect(container.querySelector('svg')).toBeInTheDocument();
      unmount();
    }
  });

  it('exposes an accessible status label', () => {
    render(
      <ThemeProvider theme={theme}>
        <StatusChip status="off-track" />
      </ThemeProvider>,
    );
    expect(screen.getByLabelText('Status: Off track')).toBeInTheDocument();
  });
});
