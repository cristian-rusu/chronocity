import { create } from 'zustand';
import { city } from '../../city-network/public-api';
import type { Activity, Plan } from '../../citizen-planning/public-api';
import { validateActivity } from '../../citizen-planning/public-api';
import type { Incident } from '../../aftershock/public-api';
import type { ScenarioState } from '../application/scenario-storage.port';
import { browserScenarioStorage } from '../infrastructure/public-api';

function safeLocalStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

const storage = safeLocalStorage();
const scenarioStorage = browserScenarioStorage(storage);
const initial = scenarioStorage.load();
type Store = ScenarioState & {
  storageAvailable: boolean;
  selectProfile: (id: string) => void;
  updatePlan: (plan: Plan) => void;
  saveActivity: (activity: Activity) => string;
  removeActivity: (id: string) => void;
  moveActivity: (id: string, delta: number) => void;
  updateIncident: (incident: Incident) => void;
  accept: (order: string[] | null, routes?: string[][] | null) => void;
  reset: () => void;
};

function persist(state: ScenarioState): boolean {
  return scenarioStorage.save(state);
}
export const useScenario = create<Store>((set, get) => ({
  ...initial,
  storageAvailable: storage !== undefined,
  selectProfile: (profile) =>
    set((state) => {
      if (!Object.prototype.hasOwnProperty.call(state.plans, profile)) return state;
      const next = { ...state, profile, acceptedOrder: null, acceptedRoutes: null };
      return { ...next, storageAvailable: persist(next) };
    }),
  updatePlan: (plan) =>
    set((state) => {
      const next = {
        ...state,
        plans: { ...state.plans, [state.profile]: plan },
        acceptedOrder: null,
        acceptedRoutes: null,
      };
      return { ...next, storageAvailable: persist(next) };
    }),
  saveActivity: (activity) => {
    const error = validateActivity(activity, new Set(city.places.map((place) => place.id)));
    if (error) return error;
    const state = get();
    const current = state.plans[state.profile];
    const exists = current.activities.some((item) => item.id === activity.id);
    if (!exists && current.activities.length >= 6) return 'Maximum six activities.';
    get().updatePlan({
      ...current,
      activities: exists
        ? current.activities.map((item) => (item.id === activity.id ? activity : item))
        : [...current.activities, activity],
    });
    return '';
  },
  removeActivity: (id) => {
    const state = get();
    const plan = state.plans[state.profile];
    state.updatePlan({ ...plan, activities: plan.activities.filter((item) => item.id !== id) });
  },
  moveActivity: (id, delta) => {
    const state = get();
    const plan = state.plans[state.profile];
    const activities = [...plan.activities];
    const index = activities.findIndex((item) => item.id === id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= activities.length) return;
    [activities[index], activities[target]] = [activities[target], activities[index]];
    state.updatePlan({ ...plan, activities });
  },
  updateIncident: (incident) =>
    set((state) => {
      const normalized: Incident = {
        ...incident,
        delay: Number.isFinite(incident.delay) ? Math.max(0, Math.round(incident.delay)) : 0,
      };
      const next = { ...state, incident: normalized, acceptedOrder: null, acceptedRoutes: null };
      return { ...next, storageAvailable: persist(next) };
    }),
  accept: (acceptedOrder, acceptedRoutes = null) =>
    set((state) => {
      const next = { ...state, acceptedOrder, acceptedRoutes };
      return { ...next, storageAvailable: persist(next) };
    }),
  reset: () =>
    set(() => {
      const next = scenarioStorage.defaults();
      return { ...next, storageAvailable: persist(next) };
    }),
}));
