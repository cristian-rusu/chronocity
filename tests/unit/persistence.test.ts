import { expect, it } from 'vitest';
import { defaultIncident } from '../../src/contexts/aftershock/public-api';
import {
  defaults,
  loadState,
  saveState,
} from '../../src/contexts/scenario-management/infrastructure/public-api';
import { useScenario } from '../../src/contexts/scenario-management/public-api';

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

it('falls back when active profile plan is missing and backfills missing non-active plans', () => {
  const missingActive = defaults();
  delete missingActive.plans.emma;
  expect(loadState({ getItem: () => JSON.stringify(missingActive) })).toEqual(defaults());

  const missingOther = defaults();
  missingOther.profile = 'noah';
  delete missingOther.plans.maya;
  const loaded = loadState({ getItem: () => JSON.stringify(missingOther) });
  expect(loaded.profile).toBe('noah');
  expect(loaded.plans.maya).toEqual(defaults().plans.maya);
});

it('rejects legacy storage with an unknown profile id', () => {
  const legacy = {
    profile: 'unknown',
    plan: defaults().plans.emma,
    incident: defaultIncident,
  };
  expect(
    loadState({
      getItem: (key: string) => (key === 'chronocity' ? JSON.stringify(legacy) : null),
    }),
  ).toEqual(defaults());
});

it('sanitizes fractional or NaN incident delay and guards profile selection in useScenario', () => {
  useScenario.getState().reset();
  useScenario.getState().updateIncident({ ...defaultIncident, delay: 15.5 });
  expect(useScenario.getState().incident.delay).toBe(16);
  useScenario.getState().updateIncident({ ...defaultIncident, delay: Number.NaN });
  expect(useScenario.getState().incident.delay).toBe(0);
  useScenario.getState().selectProfile('unknown');
  expect(useScenario.getState().profile).toBe('emma');
  useScenario.getState().reset();
});
