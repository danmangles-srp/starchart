import { describe, it, expect } from 'vitest';
import { parseServerEnv } from './env';

const valid: Record<string, string> = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/cadence',
  AUTH_SECRET: 'secret',
  AUTH_GOOGLE_ID: 'gid',
  AUTH_GOOGLE_SECRET: 'gsecret',
  AUTH_MICROSOFT_ENTRA_ID_ID: 'mid',
  AUTH_MICROSOFT_ENTRA_ID_SECRET: 'msecret',
  AUTH_MICROSOFT_ENTRA_ID_TENANT_ID: 'tenant',
  ALLOWED_EMAIL_DOMAINS: 'example.com',
};

describe('parseServerEnv', () => {
  it('parses a valid environment and defaults NODE_ENV', () => {
    const env = parseServerEnv(valid);
    expect(env.DATABASE_URL).toContain('postgresql://');
    expect(env.NODE_ENV).toBe('development');
  });

  it('throws naming a missing required var', () => {
    const rest: Record<string, string | undefined> = { ...valid };
    delete rest.AUTH_SECRET;
    expect(() => parseServerEnv(rest)).toThrow(/AUTH_SECRET/);
  });

  it('throws on an invalid DATABASE_URL', () => {
    expect(() => parseServerEnv({ ...valid, DATABASE_URL: 'not-a-url' })).toThrow(/DATABASE_URL/);
  });
});
