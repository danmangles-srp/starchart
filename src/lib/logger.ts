import pino, { type Logger } from 'pino';

/**
 * Canonical log tags (NFR-8.1). Every server log line is emitted through a
 * tag-bound child logger so logs are filterable by area; shipped code never
 * uses console.* (enforced by eslint no-console in src).
 */
export const LOG_TAGS = [
  'AUTH',
  'ORG',
  'TEAM',
  'ROCKS',
  'DATA',
  'ISSUES',
  'TODOS',
  'HOME',
  'ADMIN',
  'DB',
  'API',
  'CORE',
] as const;

export type LogTag = (typeof LOG_TAGS)[number];

const root: Logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  base: undefined,
});

export type AppLogger = Logger;

/** A child logger bound to a tag, e.g. `logger('ROCKS').info({ rockId }, 'created')`. */
export function logger(tag: LogTag): AppLogger {
  return root.child({ tag });
}
