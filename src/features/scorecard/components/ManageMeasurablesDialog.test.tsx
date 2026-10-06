import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme/theme';
import ManageMeasurablesDialog from './ManageMeasurablesDialog';
import type { ScorecardRowVM } from '../domain/viewModel';

type Result = { ok: boolean; error?: string; message?: string; data?: unknown };
const h = vi.hoisted(() => ({
  refresh: vi.fn(),
  createMeasurableAction: vi.fn(async (): Promise<Result> => ({ ok: true, data: { id: 'x' } })),
  updateMeasurableAction: vi.fn(async (): Promise<Result> => ({ ok: true, data: { id: 'x' } })),
  archiveMeasurableAction: vi.fn(async (): Promise<Result> => ({ ok: true, data: {} })),
  reorderMeasurablesAction: vi.fn(async (): Promise<Result> => ({ ok: true, data: {} })),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: h.refresh, push: vi.fn() }) }));
vi.mock('../server/actions', () => ({
  createMeasurableAction: h.createMeasurableAction,
  updateMeasurableAction: h.updateMeasurableAction,
  archiveMeasurableAction: h.archiveMeasurableAction,
  reorderMeasurablesAction: h.reorderMeasurablesAction,
}));

const members = [
  { userId: 'u1', name: 'Alice' },
  { userId: 'u2', name: 'Bob' },
];
const rows: ScorecardRowVM[] = [
  {
    id: 'm1',
    name: 'Calls',
    ownerId: 'u1',
    ownerName: 'Alice',
    goalLabel: '≥ 50',
    summary: '0/1 on goal',
    comparator: 'GTE',
    goalValue: 50,
    goalMax: null,
    format: 'NUMBER',
    unit: null,
    cellsByWeek: {},
  },
];

function renderDialog() {
  return render(
    <ThemeProvider theme={theme}>
      <ManageMeasurablesDialog open onClose={vi.fn()} teamId="mk1" rows={rows} members={members} />
    </ThemeProvider>,
  );
}

describe('ManageMeasurablesDialog', () => {
  beforeEach(() => {
    h.refresh.mockReset();
    h.createMeasurableAction.mockReset().mockResolvedValue({ ok: true, data: { id: 'x' } });
    h.updateMeasurableAction.mockReset().mockResolvedValue({ ok: true, data: { id: 'x' } });
    h.archiveMeasurableAction.mockReset().mockResolvedValue({ ok: true, data: {} });
  });

  it('lists existing measurables with reorder/edit/archive controls', () => {
    renderDialog();
    expect(screen.getByLabelText('Reorder Calls')).toBeInTheDocument();
    expect(screen.getByLabelText('Edit Calls')).toBeInTheDocument();
    expect(screen.getByLabelText('Archive Calls')).toBeInTheDocument();
  });

  it('creates a measurable from the form', async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.type(screen.getByLabelText('Name'), 'Revenue');
    const target = screen.getByLabelText('Target');
    await user.clear(target);
    await user.type(target, '1000');
    await user.click(screen.getByRole('button', { name: /add measurable/i }));
    await waitFor(() =>
      expect(h.createMeasurableAction).toHaveBeenCalledWith(
        expect.objectContaining({
          teamId: 'mk1',
          name: 'Revenue',
          comparator: 'GTE',
          goalMax: null,
        }),
      ),
    );
    expect(h.refresh).toHaveBeenCalled();
  });

  it('requires an upper bound when the goal is BETWEEN', async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.type(screen.getByLabelText('Name'), 'Range');
    await user.click(screen.getByLabelText('Goal'));
    await user.click(await screen.findByRole('option', { name: /between/i }));
    // the upper-bound field now exists; leaving it empty blocks submit
    expect(screen.getByLabelText('Upper bound')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /add measurable/i }));
    expect(await screen.findByText(/upper bound at least the lower bound/i)).toBeInTheDocument();
    expect(h.createMeasurableAction).not.toHaveBeenCalled();
  });

  it('archives after a confirm step', async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByLabelText('Archive Calls'));
    await user.click(screen.getByRole('button', { name: /^confirm$/i }));
    await waitFor(() =>
      expect(h.archiveMeasurableAction).toHaveBeenCalledWith({ measurableId: 'm1' }),
    );
  });

  it('loads a row into the form for editing', async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByLabelText('Edit Calls'));
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    const name = screen.getByLabelText('Name') as HTMLInputElement;
    expect(name.value).toBe('Calls');
    await user.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() =>
      expect(h.updateMeasurableAction).toHaveBeenCalledWith(
        expect.objectContaining({ measurableId: 'm1', name: 'Calls' }),
      ),
    );
  });
});
