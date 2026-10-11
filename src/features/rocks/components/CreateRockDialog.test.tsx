import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme/theme';
import type { RockLevel } from '../domain/rock';

const h = vi.hoisted(() => ({
  createRockAction: vi.fn(async () => ({ ok: true, data: { id: 'x' } })),
  refresh: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: h.refresh }) }));
vi.mock('../server/actions', () => ({ createRockAction: h.createRockAction }));

import CreateRockDialog from './CreateRockDialog';

function renderDialog(props?: {
  allowedLevels?: RockLevel[];
  fixedOwner?: { userId: string; name: string };
}) {
  return render(
    <ThemeProvider theme={theme}>
      <CreateRockDialog
        open
        onClose={() => {}}
        teamId="mk1"
        members={[{ userId: 'u1', name: 'Alice' }]}
        allowedLevels={props?.allowedLevels ?? ['TEAM']}
        fixedOwner={props?.fixedOwner}
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

  it('offers only the allowed levels (B1 — no guaranteed-forbidden option)', async () => {
    renderDialog({ allowedLevels: ['TEAM', 'COMPANY'] });
    const select = screen.getByRole('combobox', { name: 'Level' });
    await userEvent.click(select);
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByRole('option', { name: 'Team' })).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: 'Company' })).toBeInTheDocument();
    expect(within(listbox).queryByRole('option', { name: 'Individual' })).toBeNull();
  });

  it('hides the level picker and forces the owner in personal mode', async () => {
    renderDialog({ allowedLevels: ['INDIVIDUAL'], fixedOwner: { userId: 'me', name: 'Me' } });
    expect(screen.queryByRole('combobox', { name: 'Level' })).toBeNull();
    await userEvent.type(screen.getByLabelText('Title'), 'Read a book');
    await userEvent.click(screen.getByRole('button', { name: 'Add Rock' }));
    await waitFor(() =>
      expect(h.createRockAction).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'INDIVIDUAL', ownerId: 'me', teamId: null }),
      ),
    );
  });
});
