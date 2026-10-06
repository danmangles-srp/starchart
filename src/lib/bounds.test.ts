import { describe, it, expect } from 'vitest';
import { MAX_TEAM_LIST } from './bounds';
import { listMeasurables } from '@/features/scorecard/data/scorecardRepo';
import { listTeamIssues } from '@/features/issues/data/issuesRepo';
import { listTeamTodos } from '@/features/todos/data/todosRepo';
import { listTeamRocks } from '@/features/rocks/data/rocksRepo';

/**
 * Bounded-query audit (NFR-2.3): every per-team list read must cap its result set.
 * A stub prisma records the findMany args so we assert the cap without a database.
 */
function stub() {
  const calls: Array<Record<string, unknown>> = [];
  const findMany = async (args: Record<string, unknown>) => {
    calls.push(args);
    return [];
  };
  return {
    calls,
    client: {
      measurable: { findMany },
      issue: { findMany },
      todo: { findMany },
      rock: { findMany },
    },
  };
}

describe('bounded list reads (NFR-2.3)', () => {
  it('caps listMeasurables at MAX_TEAM_LIST', async () => {
    const s = stub();
    await listMeasurables('o', 't', s.client as never);
    expect(s.calls[0]?.take).toBe(MAX_TEAM_LIST);
  });

  it('caps listTeamIssues at MAX_TEAM_LIST', async () => {
    const s = stub();
    await listTeamIssues('o', 't', s.client as never);
    expect(s.calls[0]?.take).toBe(MAX_TEAM_LIST);
  });

  it('caps listTeamTodos at MAX_TEAM_LIST', async () => {
    const s = stub();
    await listTeamTodos('o', 't', s.client as never);
    expect(s.calls[0]?.take).toBe(MAX_TEAM_LIST);
  });

  it('caps listTeamRocks at MAX_TEAM_LIST', async () => {
    const s = stub();
    await listTeamRocks('o', 't', { fiscalYear: 2026, quarterIndex: 4 }, s.client as never);
    expect(s.calls[0]?.take).toBe(MAX_TEAM_LIST);
  });
});
