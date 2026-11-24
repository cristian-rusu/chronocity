import { describe, expect, it } from 'vitest';
import { city, validateCity } from '../../src/contexts/city-network/public-api';
import {
  minutesToTime,
  profiles,
  validateActivity,
} from '../../src/contexts/citizen-planning/public-api';
import { calm, defaultIncident, edgeTime } from '../../src/contexts/aftershock/public-api';
import { route } from '../../src/contexts/temporal-simulation/public-contracts';
import { simulate } from '../../src/contexts/temporal-simulation/public-api';
import { alternatives, journeyAlternatives } from '../../src/contexts/resync/public-api';

const plan = profiles[0].plan;
describe('city and planning invariants', () => {
  it('validates the city graph', () => {
    expect(validateCity(city)).toEqual([]);
    expect(
      validateCity({
        ...city,
        edges: [...city.edges, { id: 'bad', a: 'missing', b: 'hall', minutes: 0, mode: 'Bus' }],
      }),
    ).toHaveLength(2);
  });
  it('rejects invalid obligations', () => {
    const ids = new Set(city.places.map((place) => place.id));
    expect(validateActivity({ ...plan.activities[0], duration: 0 }, ids)).toMatch(/Duration/);
    expect(
      validateActivity({ ...plan.activities[0], earliest: 1100, deadline: 1000 }, ids),
    ).toMatch(/time window/);
  });
});

describe('time dependent simulation', () => {
  it('uses exact incident boundaries and FIFO traversal', () => {
    const edge = city.edges.find((item) => item.id === 'central-hall');
    expect(edge).toBeDefined();
    if (!edge) return;
    expect(edgeTime(edge, 950, defaultIncident)).toBe(12);
    expect(edgeTime(edge, 980, defaultIncident)).toBe(42);
    expect(edgeTime(edge, 1075, defaultIncident)).toBe(17);
    expect(edgeTime(edge, 1080, defaultIncident)).toBe(12);
    for (let time = 900; time < 1150; time++)
      expect(time + edgeTime(edge, time, defaultIncident)).toBeLessThanOrEqual(
        time + 1 + edgeTime(edge, time + 1, defaultIncident),
      );
  });
  it('does not allow a locked path to teleport', () => {
    expect(
      route(city, 'home', 'hall', 960, calm, {
        nodes: ['work', 'hall'],
        edges: ['central-hall'],
        minutes: 12,
      }),
    ).toBeNull();
  });
  it('models waiting and service closure', () => {
    const one = { ...plan, activities: [{ ...plan.activities[0], earliest: 995 }] };
    const result = simulate(city, one, calm);
    expect(result.steps[0].wait).toBe(15);
    expect(result.steps[0].finish).toBe(1015);
    const closed = simulate(city, one, { ...calm, closure: 'hall' });
    expect(closed.completed).toBe(0);
  });
  it('separates projections from confirmed completion', () => {
    const base = simulate(city, plan, calm);
    const disrupted = simulate(city, plan, defaultIncident, undefined, base);
    expect(base.completed).toBe(3);
    expect(disrupted.steps[1].projected).toBe(true);
    expect(disrupted.completed).toBeLessThan(3);
  });
  it('is deterministic', () =>
    expect(simulate(city, plan, defaultIncident)).toEqual(simulate(city, plan, defaultIncident)));
});

describe('recovery engine', () => {
  it('preserves deferred obligations under closure', () => {
    const result = alternatives(city, plan, { ...defaultIncident, closure: 'hall' })[0];
    expect(result.all).toBe(false);
    expect(result.omitted.some((item) => item.place === 'hall')).toBe(true);
  });
  it('preserves fixed order', () => {
    const fixed = structuredClone(plan);
    fixed.activities[0].fixedOrder = true;
    for (const result of alternatives(city, fixed, defaultIncident))
      if (result.order.includes('hall')) expect(result.order[0]).toBe('hall');
  });
  it('finds distinct physical routes', () => {
    const results = journeyAlternatives(city, plan, defaultIncident);
    const signatures = results.map((result) =>
      result.steps.map((step) => `${step.activity.id}:${step.path?.edges.join(',')}`).join('|'),
    );
    expect(new Set(signatures).size).toBe(results.length);
    expect(results.length).toBeGreaterThan(1);
  });
  it('recovers a disrupted baseline journey completely', () => {
    const base = simulate(city, plan, calm);
    const disrupted = simulate(city, plan, defaultIncident, undefined, base);
    expect(disrupted.all).toBe(false);
    const results = journeyAlternatives(city, plan, defaultIncident);
    expect(results[0].all).toBe(true);
    expect(results[0].completed).toBe(plan.activities.length);
  });
  it('rounds fractional minutes in minutesToTime', () => {
    expect(minutesToTime(995.5)).toBe('16:36');
    expect(minutesToTime(1000.2)).toBe('16:40');
  });
});
