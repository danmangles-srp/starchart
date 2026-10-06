/**
 * Query bounds (NFR-2.3): list reads are always capped so a single team can't
 * pull an unbounded result set. Far above any real team's item count, but a hard
 * ceiling the UI + server can rely on.
 */
export const MAX_TEAM_LIST = 500;
