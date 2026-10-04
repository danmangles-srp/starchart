import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

describe('state primitives', () => {
  it('LoadingState announces busy', () => {
    render(<LoadingState rows={2} />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('EmptyState shows a title and an action', () => {
    render(
      <EmptyState
        title="No Rocks yet"
        description="Add the first one."
        action={<button>Add Rock</button>}
      />,
    );
    expect(screen.getByText('No Rocks yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Rock' })).toBeInTheDocument();
  });

  it('ErrorState is an alert and retries on click', async () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
