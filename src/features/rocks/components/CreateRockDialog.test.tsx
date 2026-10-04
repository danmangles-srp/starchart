import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme/theme';

const h = vi.hoisted(() => ({
  createRockAction: vi.fn(async () => ({ ok: true, data: { id: 'x' } })),
  refresh: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: h.refresh }) }));
vi.mock('../server/actions', () => ({ createRockAction: h.createRockAction }));

import CreateRockDialog from './CreateRockDialog';

function renderDialog() {
  return render(
    <ThemeProvider theme={theme}>
      <CreateRockDialog
        open
        onClose={() => {}}
        teamId="mk1"
        members={[{ userId: 'u1', name: 'Alice' }]}
        quarter={{ fiscalYear: 2026, quarterIndex: 1 }}
      />
    </ThemeProvider>,
  );
}

describe('CreateRockDialog', () => {
  beforeEach(() => h.createRockAction.mockClear());

  it('submits a well-formed create input', async () => {
    renderDialog();
    await userEvent.type(screen.getByLabelText('Title'), 'Ship it');
    await userEvent.click(screen.getByRole('button', { name: 'Add Rock' }));
    await waitFor(() =>
      expect(h.createRockAction).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Ship it',
          ownerId: 'u1',
          level: 'TEAM',
          teamId: 'mk1',
          fiscalYear: 2026,
          quarterIndex: 1,
        }),
      ),
    );
  });

  it('blocks submit without a title', async () => {
    renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Add Rock' }));
    await screen.findByText('Title is required');
    expect(h.createRockAction).not.toHaveBeenCalled();
  });
});
