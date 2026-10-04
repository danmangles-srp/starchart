import { describe, it, expect, vi, beforeEach } from 'vitest';

const authMock = vi.fn();
const findMany = vi.fn();
vi.mock('@/auth', () => ({ auth: () => authMock() }));
vi.mock('@/lib/db', () => ({
  db: { membership: { findMany: (...args: unknown[]) => findMany(...args) } },
}));

import { requireUser } from './requireUser';
import { UnauthenticatedError } from './errors';

describe('requireUser', () => {
  beforeEach(() => {
    authMock.mockReset();
    findMany.mockReset();
  });

  it('throws UnauthenticatedError when there is no session', async () => {
    authMock.mockResolvedValue(null);
    await expect(requireUser()).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it('builds a viewer from the session + memberships', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', orgId: 'o1', isAdmin: true } });
    findMany.mockResolvedValue([{ teamId: 't1', teamRole: 'LEAD' }]);
    await expect(requireUser()).resolves.toEqual({
      id: 'u1',
      orgId: 'o1',
      isAdmin: true,
      memberships: [{ teamId: 't1', teamRole: 'LEAD' }],
    });
  });
});
