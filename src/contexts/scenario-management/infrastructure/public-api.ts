import { z } from 'zod';
import { profiles } from '../../citizen-planning/public-api';
import { city } from '../../city-network/public-api';
import type { Plan } from '../../citizen-planning/public-api';
import { blankPolicy, type Policy } from '../../urban-intelligence/public-api';
import { defaultIncident, type Incident } from '../../aftershock/public-api';
import type { ScenarioStorage } from '../application/scenario-storage.port';

const locationIds = new Set(city.places.map((place) => place.id));
const edgeIds = new Set(city.edges.map((edge) => edge.id));
const activity = z
  .object({
    id: z.string(),
    title: z.string(),
    place: z.string(),
    duration: z.number().int().positive(),
    earliest: z.number().int().min(0),
    deadline: z.number().int().max(1440),
    deadlineType: z.enum(['arrival', 'finish']),
    priority: z.enum(['essential', 'flexible']),
    fixedOrder: z.boolean(),
  })
  .refine((value) => value.earliest <= value.deadline && locationIds.has(value.place));
const plan = z
  .object({
    startPlace: z.string(),
    startTime: z.number().int().min(0).max(1439),
    activities: z.array(activity).max(6),
  })
  .refine(
    (value) =>
      locationIds.has(value.startPlace) &&
      new Set(value.activities.map((item) => item.id)).size === value.activities.length,
  );
const incident = z
  .object({
    edge: z.string(),
    delay: z.number().min(0),
    start: z.number().min(0),
    end: z.number().max(1440),
    closure: z.string(),
  })
  .refine(
    (value) =>
      value.start < value.end &&
      edgeIds.has(value.edge) &&
      (value.closure === '' || locationIds.has(value.closure)),
  );
const policy = z.object({
  shuttle: z.boolean(),
  lateHall: z.boolean(),
  lateChild: z.boolean(),
  extraBus: z.boolean(),
});
const schema = z.object({
  version: z.literal(1),
  profile: z.string(),
  plans: z.record(z.string(), plan),
  incident,
  policy,
  budget: z.number().int().min(0).max(9),
  objective: z.enum(['access', 'equity']),
  acceptedOrder: z.array(z.string()).nullable(),
  acceptedRoutes: z.array(z.array(z.string())).nullable().optional(),
});

export type PersistedState = {
  version: 1;
  profile: string;
  plans: Record<string, Plan>;
  incident: Incident;
  policy: Policy;
  budget: number;
  objective: 'access' | 'equity';
  acceptedOrder: string[] | null;
  acceptedRoutes?: string[][] | null;
};
export const defaults = (): PersistedState => ({
  version: 1,
  profile: profiles[0].id,
  plans: Object.fromEntries(profiles.map((item) => [item.id, structuredClone(item.plan)])),
  incident: { ...defaultIncident, delay: 0 },
  policy: { ...blankPolicy },
  budget: 5,
  objective: 'access',
  acceptedOrder: null,
  acceptedRoutes: null,
});

export function loadState(storage: Pick<Storage, 'getItem'> | undefined): PersistedState {
  const fallback = defaults();
  if (!storage) return fallback;
  try {
    const current = storage.getItem('chronocity:v1');
    if (current) {
      const parsed = schema.safeParse(JSON.parse(current));
      if (parsed.success && profiles.some((item) => item.id === parsed.data.profile))
        return parsed.data;
    }
    const legacy = storage.getItem('chronocity');
    if (legacy) {
      const data: unknown = JSON.parse(legacy);
      if (typeof data === 'object' && data !== null) {
        const old = data as Record<string, unknown>;
        const parsed = schema.safeParse({
          ...fallback,
          profile: old.profile,
          plans: {
            ...fallback.plans,
            ...(typeof old.savedPlans === 'object' && old.savedPlans ? old.savedPlans : {}),
            [String(old.profile)]: old.plan,
          },
          incident: old.incident,
          policy: old.policy,
          budget: old.budget,
          objective: old.objective,
          acceptedOrder: null,
          acceptedRoutes: null,
        });
        if (parsed.success) return parsed.data;
      }
    }
  } catch {
    /* Corrupt or unavailable storage leaves a valid in-memory default. */
  }
  return fallback;
}

export function saveState(
  storage: Pick<Storage, 'setItem'> | undefined,
  value: PersistedState,
): boolean {
  if (!storage) return false;
  try {
    storage.setItem('chronocity:v1', JSON.stringify(schema.parse(value)));
    return true;
  } catch {
    return false;
  }
}

export function browserScenarioStorage(storage: Storage | undefined): ScenarioStorage {
  return {
    load: () => loadState(storage),
    save: (state) => saveState(storage, state),
    defaults,
  };
}
