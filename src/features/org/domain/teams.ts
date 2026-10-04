export interface TeamSummaryRow {
  id: string;
  name: string;
  isLeadership: boolean;
  departmentId: string | null;
  departmentName: string | null;
  order: number;
  departmentOrder: number;
}

export interface TeamGroup {
  name: string;
  teams: TeamSummaryRow[];
}

export interface GroupedTeams {
  leadership: TeamSummaryRow[];
  departments: TeamGroup[];
}

/** Group teams for the switcher: Leadership pinned first, then departments in order (FR-2.3). Pure. */
export function groupTeamsByDepartment(teams: TeamSummaryRow[]): GroupedTeams {
  const leadership = teams.filter((t) => t.isLeadership).sort((a, b) => a.order - b.order);

  const byDept = new Map<string, TeamGroup & { order: number }>();
  for (const team of teams) {
    if (team.isLeadership) continue;
    const key = team.departmentId ?? '_none';
    const existing = byDept.get(key) ?? {
      name: team.departmentName ?? 'Other',
      teams: [],
      order: team.departmentOrder,
    };
    existing.teams.push(team);
    byDept.set(key, existing);
  }

  const departments = [...byDept.values()]
    .sort((a, b) => a.order - b.order)
    .map(({ name, teams: deptTeams }) => ({
      name,
      teams: [...deptTeams].sort((a, b) => a.order - b.order),
    }));

  return { leadership, departments };
}
