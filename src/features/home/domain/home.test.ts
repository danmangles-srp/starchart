import { describe, it, expect } from 'vitest';
import {
  myWeekPanels,
  myWeekAttentionCount,
  assembleTeamDashboards,
  teamOpenTotal,
  type MyWeekData,
  type TeamSummaries,
} from './home';
import type { RockSummary } from '@/features/rocks/domain/rock';
import type { TodoRow } from '@/features/todos/domain/todo';

const now = new Date('2026-10-06T12:00:00Z');

function rock(status: RockSummary['status']): RockSummary {
  return {
    id: `r-${Math.random()}`,
    title: 'R',
    ownerId: 'u1',
    ownerName: 'A',
    level: 'TEAM',
    teamId: 'mk1',
    fiscalYear: 2026,
    quarterIndex: 4,
    status,
    milestonesDone: 0,
    milestonesTotal: 0,
    dueDate: null,
  };
}
function todo(dueDate: string, done = false): TodoRow {
  return {
    id: `t-${Math.random()}`,
    title: 'T',
    notes: null,
    ownerId: 'u1',
    ownerName: 'A',
    teamId: 'mk1',
    dueDate,
    done,
    completedAt: null,
    sourceIssueId: null,
    sourceRockId: null,
  };
}

const data: MyWeekData = {
  rocks: [rock('on-track'), rock('at-risk'), rock('off-track')],
  todos: [todo('2026-10-01T00:00:00Z'), todo('2099-01-01T00:00:00Z')], // 1 overdue
  measurables: [
    {
      id: 'm1',
      name: 'M',
      ownerId: 'u1',
      ownerName: 'A',
      goalValue: 1,
      goalMax: null,
      comparator: 'GTE',
      format: 'NUMBER',
      unit: null,
      order: 1,
      latestValue: 0,
      status: 'off',
    },
  ],
  issues: [],
};

describe('myWeekPanels', () => {
  it('counts each list', () => {
    expect(myWeekPanels(data)).toEqual([
      { key: 'rocks', title: 'My Rocks', count: 3 },
      { key: 'todos', title: 'My Todos', count: 2 },
      { key: 'measurables', title: 'Off-goal measurables', count: 1 },
      { key: 'issues', title: 'My Issues', count: 0 },
    ]);
  });
});

describe('myWeekAttentionCount', () => {
  it('sums overdue todos + off-goal measurables + at-risk/off-track rocks', () => {
    // 1 overdue todo + 1 off-goal + 2 rocks (at-risk, off-track) = 4
    expect(myWeekAttentionCount(data, now)).toBe(4);
  });
});

describe('assembleTeamDashboards', () => {
  const summaries = (over: Partial<TeamSummaries> = {}): TeamSummaries => ({
    rocks: { total: 0, onTrack: 1, atRisk: 0, offTrack: 0, done: 0 },
    scorecard: { total: 0, onGoal: 0, offGoal: 0, empty: 0 },
    todos: { total: 0, open: 2, overdue: 0, done: 0 },
    issues: { total: 0, shortOpen: 1, longOpen: 0, solved: 0 },
    ...over,
  });

  it('zips teams with summaries, alphabetical, skipping missing', () => {
    const teams = [
      { id: 'sa1', name: 'Sales' },
      { id: 'mk1', name: 'Marketing' },
      { id: 'no', name: 'No data' },
    ];
    const byTeam = new Map([
      ['sa1', summaries()],
      ['mk1', summaries()],
    ]);
    const rows = assembleTeamDashboards(teams, byTeam);
    expect(rows.map((r) => r.teamName)).toEqual(['Marketing', 'Sales']); // sorted, "No data" skipped
  });

  it('teamOpenTotal sums open rocks + todos + issues', () => {
    const row = assembleTeamDashboards(
      [{ id: 'mk1', name: 'Marketing' }],
      new Map([['mk1', summaries()]]),
    )[0]!;
    expect(teamOpenTotal(row)).toBe(1 + 2 + 1); // onTrack 1, todos open 2, shortOpen 1
  });
});
