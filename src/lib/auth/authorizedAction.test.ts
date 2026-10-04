import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { authorizedAction } from './authorizedAction';
import { ForbiddenError, NotFoundError } from './errors';
import type { Viewer } from './permissions';

const viewer: Viewer = {
  id: 'u1',
  orgId: 'o1',
  isAdmin: false,
  memberships: [{ teamId: 't1', teamRole: 'MEMBER' }],
};
const getViewer = () => Promise.resolve(viewer);
const schema = z.object({ title: z.string().min(1) });

describe('authorizedAction', () => {
  it('rejects invalid input before authorizing or handling', async () => {
    const authorize = vi.fn().mockReturnValue(true);
    const handler = vi.fn();
    const action = authorizedAction({ schema, authorize, handler }, { getViewer });

    const result = await action({ title: '' });

    expect(result).toMatchObject({ ok: false, error: 'invalid-input' });
    expect(authorize).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });

  it('refuses an unauthorized actor without running the handler', async () => {
    const handler = vi.fn();
    const action = authorizedAction({ schema, authorize: () => false, handler }, { getViewer });

    const result = await action({ title: 'Rock' });

    expect(result).toMatchObject({ ok: false, error: 'forbidden' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('runs the handler + audit on success and returns typed data', async () => {
    const handler = vi.fn(async (ctx: { input: { title: string } }) => ({
      id: 'x',
      title: ctx.input.title,
    }));
    const audit = vi.fn(async () => undefined);
    const action = authorizedAction(
      { schema, authorize: () => true, handler, audit },
      { getViewer },
    );

    const result = await action({ title: 'Rock' });

    expect(result).toEqual({ ok: true, data: { id: 'x', title: 'Rock' } });
    expect(handler).toHaveBeenCalledOnce();
    expect(audit).toHaveBeenCalledOnce();
  });

  it('maps an AppError thrown in the handler to its code', async () => {
    const action = authorizedAction(
      {
        schema,
        authorize: () => true,
        handler: () => {
          throw new NotFoundError();
        },
      },
      { getViewer },
    );
    expect(await action({ title: 'Rock' })).toMatchObject({ ok: false, error: 'not-found' });
  });

  it('never leaks an unexpected error', async () => {
    const action = authorizedAction(
      {
        schema,
        authorize: () => true,
        handler: () => {
          throw new Error('raw prisma boom');
        },
      },
      { getViewer },
    );
    const result = await action({ title: 'Rock' });
    expect(result).toMatchObject({ ok: false, error: 'unknown' });
    if (!result.ok) expect(result.message).not.toContain('prisma');
  });

  it('propagates a thrown ForbiddenError from authorize paths', async () => {
    const action = authorizedAction(
      {
        schema,
        authorize: () => {
          throw new ForbiddenError();
        },
        handler: vi.fn(),
      },
      { getViewer },
    );
    expect(await action({ title: 'Rock' })).toMatchObject({ ok: false, error: 'forbidden' });
  });
});
