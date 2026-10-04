export const ACTIVITY_ACTIONS = {
  ROLE_CHANGED: 'role.changed',
  TEAM_CREATED: 'team.created',
  TEAM_RENAMED: 'team.renamed',
  TEAM_ARCHIVED: 'team.archived',
  DEPARTMENT_CREATED: 'department.created',
  MEMBER_ADDED: 'member.added',
  MEMBER_REMOVED: 'member.removed',
  ROCK_STATUS_CHANGED: 'rock.status_changed',
  ISSUE_SOLVED: 'issue.solved',
  MEASURABLE_ARCHIVED: 'measurable.archived',
  QUARTER_UPSERTED: 'quarter.upserted',
} as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[keyof typeof ACTIVITY_ACTIONS];

export interface ActivityRow {
  id: string;
  action: string;
  actorName: string;
  targetType: string;
  targetId: string | null;
  teamId: string | null;
  createdAt: string; // ISO
}

const LABELS: Record<string, string> = {
  'role.changed': 'changed a role',
  'team.created': 'created a team',
  'team.renamed': 'renamed a team',
  'team.archived': 'archived a team',
  'department.created': 'created a department',
  'member.added': 'added a member',
  'member.removed': 'removed a member',
  'rock.status_changed': 'updated a Rock status',
  'issue.solved': 'solved an Issue',
  'measurable.archived': 'archived a measurable',
  'quarter.upserted': 'updated a quarter definition',
};

/** Human phrase for an activity action; falls back to a readable form of the key. */
export function describeActivity(action: string): string {
  return LABELS[action] ?? action.replace(/[._]/g, ' ');
}
