import { z } from 'zod';
import { profiles } from '../../citizen-planning/public-api';
import { city } from '../../city-network/public-api';
import type { Plan } from '../../citizen-planning/public-api';
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
    delay: z.number().int().min(0),
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
const schema = z.object({
  version: z.literal(1),
  profile: z.string(),
  plans: z.record(z.string(), plan),
  incident,
  acceptedOrder: z.array(z.string()).nullable(),
  acceptedRoutes: z.array(z.array(z.string())).nullable().optional(),
});

export type PersistedState = {
  version: 1;
  profile: string;
  plans: Record<string, Plan>;
  incident: Incident;
  acceptedOrder: string[] | null;
  acceptedRoutes?: string[][] | null;
};
export const defaults = (): PersistedState => ({
  version: 1,
  profile: profiles[0].id,
  plans: Object.fromEntries(profiles.map((item) => [item.id, structuredClone(item.plan)])),
  incident: { ...defaultIncident },
  acceptedOrder: null,
  acceptedRoutes: null,
});

function hasValidProfileAndPlans(data: PersistedState): boolean {
  return (
    profiles.some((item) => item.id === data.profile) &&
    Object.prototype.hasOwnProperty.call(data.plans, data.profile)
  );
}

export function loadState(storage: Pick<Storage, 'getItem'> | undefined): PersistedState {
  const fallback = defaults();
  if (!storage) return fallback;
  try {
    const current = storage.getItem('chronocity:v1');
    if (current) {
      const parsed = schema.safeParse(JSON.parse(current));
      if (parsed.success && hasValidProfileAndPlans(parsed.data)) {
        return {
          ...parsed.data,
          plans: { ...fallback.plans, ...parsed.data.plans },
        };
      }
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
          acceptedOrder: null,
          acceptedRoutes: null,
        });
        if (parsed.success && hasValidProfileAndPlans(parsed.data)) {
          return {
            ...parsed.data,
            plans: { ...fallback.plans, ...parsed.data.plans },
          };
        }
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
