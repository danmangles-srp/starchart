import type { RockStatus } from '@/theme/status';

export type RockLevel = 'COMPANY' | 'TEAM' | 'INDIVIDUAL';
export type DbRockStatus = 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK' | 'DONE';

const FROM_DB: Record<DbRockStatus, RockStatus> = {
  ON_TRACK: 'on-track',
  AT_RISK: 'at-risk',
  OFF_TRACK: 'off-track',
  DONE: 'done',
};
const TO_DB: Record<RockStatus, DbRockStatus> = {
  'on-track': 'ON_TRACK',
  'at-risk': 'AT_RISK',
  'off-track': 'OFF_TRACK',
  done: 'DONE',
};

/** Prisma enum → domain status (the kebab form used by StatusChip). */
export function toRockStatus(value: DbRockStatus): RockStatus {
  return FROM_DB[value];
}

/** Domain status → Prisma enum. */
export function toDbRockStatus(value: RockStatus): DbRockStatus {
  return TO_DB[value];
}

export interface RockSummary {
  id: string;
  title: string;
  ownerId: string;
  level: RockLevel;
  teamId: string | null;
  fiscalYear: number;
  quarterIndex: number;
  status: RockStatus;
  milestonesDone: number;
  milestonesTotal: number;
  dueDate: string | null;
}

/** `done/total` milestone progress (FR-3.3). */
export function milestoneProgress(done: number, total: number): string {
  return `${done}/${total}`;
}
