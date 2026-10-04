'use client';

import type { ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';
import Typography from '@mui/material/Typography';
import { groupTeamsByDepartment, type TeamSummaryRow } from '@/features/org/domain/teams';
import { routes } from '@/lib/routes';

/**
 * Team switcher (FR-2.3): lists the viewer's teams (an Admin sees all), grouped by
 * department with Leadership pinned. Active team comes from the URL; choosing one
 * navigates to its dashboard, so the context is shareable via the link (FR-2.4).
 */
export default function TeamSwitcher({ teams }: { teams: TeamSummaryRow[] }) {
  const router = useRouter();
  const params = useParams<{ teamId?: string }>();
  const activeId = typeof params?.teamId === 'string' ? params.teamId : '';
  const value = teams.some((t) => t.id === activeId) ? activeId : '';

  if (teams.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        You&apos;re not on any teams yet.
      </Typography>
    );
  }

  const grouped = groupTeamsByDepartment(teams);
  const options: ReactNode[] = [];
  if (grouped.leadership.length > 0) {
    options.push(<ListSubheader key="h-leadership">Leadership</ListSubheader>);
    for (const team of grouped.leadership) {
      options.push(
        <MenuItem key={team.id} value={team.id}>
          {team.name}
        </MenuItem>,
      );
    }
  }
  for (const dept of grouped.departments) {
    options.push(<ListSubheader key={`h-${dept.name}`}>{dept.name}</ListSubheader>);
    for (const team of dept.teams) {
      options.push(
        <MenuItem key={team.id} value={team.id}>
          {team.name}
        </MenuItem>,
      );
    }
  }

  return (
    <FormControl size="small" fullWidth>
      <InputLabel id="team-switcher-label">Team</InputLabel>
      <Select
        labelId="team-switcher-label"
        label="Team"
        value={value}
        displayEmpty
        renderValue={(selected) =>
          selected ? (teams.find((t) => t.id === selected)?.name ?? '') : 'Select a team'
        }
        onChange={(event) => router.push(routes.team(event.target.value))}
      >
        {options}
      </Select>
    </FormControl>
  );
}
