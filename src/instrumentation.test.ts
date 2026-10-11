import { describe, it, expect, vi, afterEach } from 'vitest';

/**
 * The boot hook must validate the environment on the Node.js runtime (fail-fast,
 * T8.1) and do nothing on any other runtime (edge/browser never hold the secrets).
 */
describe('instrumentation register()', () => {
  const originalRuntime = process.env.NEXT_RUNTIME;

  afterEach(() => {
    process.env.NEXT_RUNTIME = originalRuntime;
    vi.resetModules();
    vi.doUnmock('@/lib/env');
  });

  it('validates the environment on the node runtime', async () => {
    const getServerEnv = vi.fn();
    vi.doMock('@/lib/env', () => ({ getServerEnv }));
    process.env.NEXT_RUNTIME = 'nodejs';

    const { register } = await import('./instrumentation');
    await register();

    expect(getServerEnv).toHaveBeenCalledOnce();
  });

  it('skips validation off the node runtime', async () => {
    const getServerEnv = vi.fn();
    vi.doMock('@/lib/env', () => ({ getServerEnv }));
    process.env.NEXT_RUNTIME = 'edge';

    const { register } = await import('./instrumentation');
    await register();

    expect(getServerEnv).not.toHaveBeenCalled();
  });
});
