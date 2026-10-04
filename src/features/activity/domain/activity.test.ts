import { describe, it, expect } from 'vitest';
import { describeActivity, ACTIVITY_ACTIONS } from './activity';

describe('describeActivity', () => {
  it('maps known actions to human phrases', () => {
    expect(describeActivity(ACTIVITY_ACTIONS.ROCK_STATUS_CHANGED)).toBe('updated a Rock status');
    expect(describeActivity(ACTIVITY_ACTIONS.TEAM_ARCHIVED)).toBe('archived a team');
  });

  it('falls back to a readable form for unknown actions', () => {
    expect(describeActivity('widget.frobnicated')).toBe('widget frobnicated');
  });
});
