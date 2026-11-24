import { expect, it } from 'vitest';
import {
  defaults,
  loadState,
  saveState,
} from '../../src/contexts/scenario-management/infrastructure/public-api';

it('recovers corrupt storage without deleting it', () => {
  const values = new Map([['chronocity:v1', '{bad']]);
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  expect(loadState(storage)).toEqual(defaults());
  expect(values.get('chronocity:v1')).toBe('{bad');
});
it('round trips versioned inputs', () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const state = defaults();
  state.incident.delay = 15;
  state.acceptedOrder = ['hall'];
  state.acceptedRoutes = [['west-central', 'central-hall']];
  expect(saveState(storage, state)).toBe(true);
  expect(loadState(storage).incident.delay).toBe(15);
  expect(loadState(storage).acceptedRoutes).toEqual([['west-central', 'central-hall']]);
});

it('rejects invalid stored references and retains in-memory defaults', () => {
  const invalid = defaults();
  invalid.plans.emma.startPlace = 'unknown';
  const storage = { getItem: () => JSON.stringify(invalid) };
  expect(loadState(storage)).toEqual(defaults());
});
