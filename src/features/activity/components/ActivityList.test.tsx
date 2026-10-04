import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ActivityList from './ActivityList';
import type { ActivityRow } from '../domain/activity';

const row: ActivityRow = {
  id: '1',
  action: 'rock.status_changed',
  actorName: 'Ada Admin',
  targetType: 'rock',
  targetId: 'r1',
  teamId: 't1',
  createdAt: '2026-01-15T10:00:00.000Z',
};

describe('ActivityList', () => {
  it('renders actor + human action', () => {
    render(<ActivityList rows={[row]} />);
    expect(screen.getByText('Ada Admin updated a Rock status')).toBeInTheDocument();
  });

  it('renders an empty state', () => {
    render(<ActivityList rows={[]} />);
    expect(screen.getByText(/no activity yet/i)).toBeInTheDocument();
  });
});
