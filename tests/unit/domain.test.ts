import { describe, expect, it } from 'vitest';
import { city, validateCity } from '../../src/modules/city-network/public-api';
import { profiles, validateActivity } from '../../src/modules/citizen-planning/public-api';
import { calm, defaultIncident, edgeTime } from '../../src/modules/aftershock/public-api';
import { route } from '../../src/modules/routing/public-api';
import { simulate } from '../../src/modules/temporal-simulation/public-api';
import { alternatives, journeyAlternatives } from '../../src/modules/resync/public-api';
import {
  blankPolicy,
  network,
  optimize,
  policyCost,
  population,
} from '../../src/modules/urban-intelligence/public-api';

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

describe('recovery and city policy', () => {
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
  it('computes policy from the same population and respects budget', () => {
    const baseline = population(defaultIncident, blankPolicy);
    const chosen = optimize(defaultIncident, 3, 'equity');
    expect(baseline.rows).toHaveLength(60);
    expect(policyCost(chosen)).toBeLessThanOrEqual(3);
    expect(network({ ...blankPolicy, shuttle: true }).edges).toHaveLength(city.edges.length + 1);
  });
});
