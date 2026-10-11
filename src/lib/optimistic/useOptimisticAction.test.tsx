import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ActionResult } from '@/lib/auth/errors';
import { useOptimisticAction } from './useOptimisticAction';

const h = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: h.refresh, push: vi.fn() }) }));

/** A tiny harness exercising the helper the way a real view does. */
function Harness({
  serverCall,
  onError,
}: {
  serverCall: () => Promise<ActionResult<unknown>>;
  onError?: (m: string) => void;
}): ReactNode {
  const { state, run, isPending } = useOptimisticAction<string[]>(['a']);
  return (
    <div>
      <output data-testid="state">{state.join(',')}</output>
      <output data-testid="pending">{String(isPending)}</output>
      <button onClick={() => run((cur) => [...cur, 'b'], serverCall, onError)}>go</button>
    </div>
  );
}

describe('useOptimisticAction', () => {
  beforeEach(() => h.refresh.mockReset());

  it('applies the optimistic transform and reconciles on success', async () => {
    const user = userEvent.setup();
    const serverCall = vi.fn(async (): Promise<ActionResult<unknown>> => ({ ok: true, data: {} }));
    render(<Harness serverCall={serverCall} />);

    await user.click(screen.getByRole('button', { name: 'go' }));

    await waitFor(() => expect(serverCall).toHaveBeenCalledOnce());
    await waitFor(() => expect(h.refresh).toHaveBeenCalledOnce());
  });

  it('surfaces the error and does not refresh when the action fails', async () => {
    const user = userEvent.setup();
    const onError = vi.fn();
    const serverCall = vi.fn(async (): Promise<ActionResult<unknown>> => ({
      ok: false,
      error: 'forbidden',
      message: 'Nope',
    }));
    render(<Harness serverCall={serverCall} onError={onError} />);

    await user.click(screen.getByRole('button', { name: 'go' }));

    await waitFor(() => expect(onError).toHaveBeenCalledWith('Nope'));
    // Rollback is automatic: the base ('a') is restored once the transition settles.
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent(/^a$/));
    expect(h.refresh).not.toHaveBeenCalled();
  });
});
