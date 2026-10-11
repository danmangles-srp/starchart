import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/theme/theme';
import type { Profile } from '../data/profileRepo';

const h = vi.hoisted(() => ({
  updateJobTitleAction: vi.fn(async () => ({ ok: true, data: { jobTitle: 'Head of Ops' } })),
}));
vi.mock('../server/actions', () => ({ updateJobTitleAction: h.updateJobTitleAction }));

import ProfileView from './ProfileView';

const profile: Profile = {
  id: 'u1',
  email: 'ada@acme.com',
  name: 'Ada Lovelace',
  image: null,
  jobTitle: null,
  isAdmin: false,
  memberships: [
    {
      teamId: 't1',
      teamName: 'Marketing',
      teamRole: 'LEAD',
      departmentName: 'Growth',
    },
  ],
};

function renderView(p: Profile = profile) {
  return render(
    <ThemeProvider theme={theme}>
      <ProfileView profile={p} />
    </ThemeProvider>,
  );
}

describe('ProfileView', () => {
  beforeEach(() => h.updateJobTitleAction.mockClear());

  it('shows identity, headline role, and team memberships (AC-1.3.2)', () => {
    renderView();
    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    // A team lead's headline role is Team Lead.
    expect(screen.getByText('Team Lead')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
  });

  it('saves a job title through the action (FR-1.3)', async () => {
    renderView();
    await userEvent.type(screen.getByLabelText('Job title'), 'Head of Ops');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(h.updateJobTitleAction).toHaveBeenCalledWith({ jobTitle: 'Head of Ops' }),
    );
    expect(await screen.findByText('Job title saved.')).toBeInTheDocument();
  });

  it('disables Save until the title changes', () => {
    renderView();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });
});
