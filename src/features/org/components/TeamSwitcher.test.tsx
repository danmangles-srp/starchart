import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme/theme';
import TeamSwitcher from './TeamSwitcher';
import type { TeamSummaryRow } from '@/features/org/domain/teams';

let params: Record<string, string> = {};
const push = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => params,
  useRouter: () => ({ push }),
}));

const teams: TeamSummaryRow[] = [
  {
    id: 'lead',
    name: 'Leadership Team',
    isLeadership: true,
    departmentId: null,
    departmentName: null,
    order: 0,
    departmentOrder: -1,
  },
  {
    id: 'mk1',
    name: 'Marketing Team 1',
    isLeadership: false,
    departmentId: 'd1',
    departmentName: 'Marketing',
    order: 1,
    departmentOrder: 1,
  },
];

function renderSwitcher() {
  return render(
    <ThemeProvider theme={theme}>
      <TeamSwitcher teams={teams} />
    </ThemeProvider>,
  );
}

describe('TeamSwitcher', () => {
  beforeEach(() => {
    params = {};
    push.mockReset();
  });

  it('prompts to select a team when none is active', () => {
    renderSwitcher();
    expect(screen.getByText('Select a team')).toBeInTheDocument();
  });

  it('shows the active team from the URL', () => {
    params = { teamId: 'mk1' };
    renderSwitcher();
    expect(screen.getByText('Marketing Team 1')).toBeInTheDocument();
  });

  it('navigates to the chosen team', async () => {
    renderSwitcher();
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'Marketing Team 1' }));
    expect(push).toHaveBeenCalledWith('/t/mk1');
  });

  it('shows a friendly message when the viewer is on no teams', () => {
    render(
      <ThemeProvider theme={theme}>
        <TeamSwitcher teams={[]} />
      </ThemeProvider>,
    );
    expect(screen.getByText(/not on any teams/i)).toBeInTheDocument();
  });
});
