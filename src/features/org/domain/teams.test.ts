import { describe, it, expect } from 'vitest';
import { groupTeamsByDepartment, type TeamSummaryRow } from './teams';

function row(partial: Partial<TeamSummaryRow> & { id: string }): TeamSummaryRow {
  return {
    name: partial.id,
    isLeadership: false,
    departmentId: null,
    departmentName: null,
    order: 0,
    departmentOrder: 0,
    ...partial,
  };
}

describe('groupTeamsByDepartment', () => {
  it('pins leadership and orders departments + teams', () => {
    const grouped = groupTeamsByDepartment([
      row({
        id: 'm2',
        departmentId: 'd1',
        departmentName: 'Marketing',
        order: 2,
        departmentOrder: 2,
      }),
      row({ id: 'lead', isLeadership: true, order: 0 }),
      row({ id: 's1', departmentId: 'd2', departmentName: 'Sales', order: 1, departmentOrder: 1 }),
      row({
        id: 'm1',
        departmentId: 'd1',
        departmentName: 'Marketing',
        order: 1,
        departmentOrder: 2,
      }),
    ]);

    expect(grouped.leadership.map((t) => t.id)).toEqual(['lead']);
    expect(grouped.departments.map((d) => d.name)).toEqual(['Sales', 'Marketing']);
    expect(grouped.departments[1]?.teams.map((t) => t.id)).toEqual(['m1', 'm2']);
  });

  it('handles a member with no teams', () => {
    expect(groupTeamsByDepartment([])).toEqual({ leadership: [], departments: [] });
  });
});
