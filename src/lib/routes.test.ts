import { describe, it, expect } from 'vitest';
import { routes, MODULE_NAV, MODULE_KEYS } from './routes';

describe('routes', () => {
  it('builds team-scoped URLs with the team in the path', () => {
    expect(routes.home()).toBe('/');
    expect(routes.admin()).toBe('/admin');
    expect(routes.team('marketing')).toBe('/t/marketing');
    expect(routes.module('marketing', 'rocks')).toBe('/t/marketing/rocks');
    expect(routes.module('t1', 'scorecard')).toBe('/t/t1/scorecard');
  });

  it('nav lists exactly the four modules in order', () => {
    expect(MODULE_NAV.map((m) => m.key)).toEqual([...MODULE_KEYS]);
  });
});
