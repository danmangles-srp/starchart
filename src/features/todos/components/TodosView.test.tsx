import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme/theme';
import TodosView from './TodosView';
import type { TodoRow } from '../domain/todo';

type Result = { ok: boolean; error?: string; message?: string; data?: unknown };
const h = vi.hoisted(() => ({
  refresh: vi.fn(),
  createTodoAction: vi.fn(async (): Promise<Result> => ({ ok: true, data: { id: 'x' } })),
  updateTodoAction: vi.fn(async (): Promise<Result> => ({ ok: true, data: { id: 'x' } })),
  deleteTodoAction: vi.fn(async (): Promise<Result> => ({ ok: true, data: {} })),
  setTodoDoneAction: vi.fn(async (): Promise<Result> => ({ ok: true, data: {} })),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: h.refresh, push: vi.fn() }) }));
vi.mock('../server/actions', () => ({
  createTodoAction: h.createTodoAction,
  updateTodoAction: h.updateTodoAction,
  deleteTodoAction: h.deleteTodoAction,
  setTodoDoneAction: h.setTodoDoneAction,
}));

const members = [{ userId: 'u1', name: 'Alice' }];
function todo(over: Partial<TodoRow> = {}): TodoRow {
  return {
    id: 't1',
    title: 'Call supplier',
    notes: null,
    ownerId: 'u1',
    ownerName: 'Alice',
    teamId: 'mk1',
    dueDate: '2026-10-20T00:00:00.000Z',
    done: false,
    completedAt: null,
    sourceIssueId: null,
    sourceRockId: null,
    ...over,
  };
}

function renderView(todos: TodoRow[], canEdit = true) {
  return render(
    <ThemeProvider theme={theme}>
      <TodosView teamId="mk1" todos={todos} members={members} canEdit={canEdit} />
    </ThemeProvider>,
  );
}

describe('TodosView', () => {
  beforeEach(() => {
    h.refresh.mockReset();
    h.createTodoAction.mockReset().mockResolvedValue({ ok: true, data: { id: 'x' } });
    h.updateTodoAction.mockReset().mockResolvedValue({ ok: true, data: { id: 'x' } });
    h.deleteTodoAction.mockReset().mockResolvedValue({ ok: true, data: {} });
    h.setTodoDoneAction.mockReset().mockResolvedValue({ ok: true, data: {} });
  });

  it('shows the empty state when there are no todos', () => {
    renderView([]);
    expect(screen.getByText('No todos yet')).toBeInTheDocument();
  });

  it('renders open and done sections with their items', () => {
    renderView([
      todo(),
      todo({ id: 't2', title: 'Old task', done: true, completedAt: '2026-10-01T00:00:00.000Z' }),
    ]);
    const open = screen.getByRole('region', { name: /open \(1\)/i });
    expect(within(open).getByText('Call supplier')).toBeInTheDocument();
    const done = screen.getByRole('region', { name: /done \(1\)/i });
    expect(within(done).getByText('Old task')).toBeInTheDocument();
  });

  it('adds a todo through the dialog', async () => {
    const user = userEvent.setup();
    renderView([]);
    await user.click(screen.getByRole('button', { name: /add the first todo/i }));
    await user.type(screen.getByLabelText('Title'), 'New task');
    await user.click(screen.getByRole('button', { name: /^add$/i }));
    await waitFor(() =>
      expect(h.createTodoAction).toHaveBeenCalledWith(
        expect.objectContaining({ teamId: 'mk1', title: 'New task', ownerId: 'u1' }),
      ),
    );
    expect(h.refresh).toHaveBeenCalled();
  });

  it('validates a required title', async () => {
    const user = userEvent.setup();
    renderView([]);
    await user.click(screen.getByRole('button', { name: /add the first todo/i }));
    await user.click(screen.getByRole('button', { name: /^add$/i }));
    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(h.createTodoAction).not.toHaveBeenCalled();
  });

  it('deletes after a confirm step', async () => {
    const user = userEvent.setup();
    renderView([todo()]);
    await user.click(screen.getByRole('button', { name: /delete call supplier/i }));
    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    await waitFor(() => expect(h.deleteTodoAction).toHaveBeenCalledWith({ todoId: 't1' }));
  });

  it('hides editing controls when the viewer cannot edit', () => {
    renderView([todo()], false);
    expect(screen.queryByRole('button', { name: /add todo/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/edit call supplier/i)).not.toBeInTheDocument();
    expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(true);
  });

  it('completes a todo optimistically and refreshes', async () => {
    const user = userEvent.setup();
    renderView([todo()]);
    await user.click(screen.getByRole('checkbox', { name: /mark call supplier done/i }));
    await waitFor(() =>
      expect(h.setTodoDoneAction).toHaveBeenCalledWith({ todoId: 't1', done: true }),
    );
    await waitFor(() => expect(h.refresh).toHaveBeenCalled());
  });

  it('rolls back the checkbox when completing fails', async () => {
    h.setTodoDoneAction.mockResolvedValue({ ok: false, error: 'forbidden', message: 'Nope' });
    const user = userEvent.setup();
    renderView([todo()]);
    await user.click(screen.getByRole('checkbox', { name: /mark call supplier done/i }));
    expect(await screen.findByText('Nope')).toBeInTheDocument();
    await waitFor(() => {
      const box = screen.getByRole('checkbox', {
        name: /mark call supplier done/i,
      }) as HTMLInputElement;
      expect(box.checked).toBe(false); // reverted
    });
    expect(h.refresh).not.toHaveBeenCalled();
  });

  it('flags an overdue open todo with an age cue (not color alone)', () => {
    renderView([todo({ dueDate: '2000-01-01T00:00:00.000Z' })]);
    expect(screen.getByText(/overdue/i)).toBeInTheDocument();
  });
});
