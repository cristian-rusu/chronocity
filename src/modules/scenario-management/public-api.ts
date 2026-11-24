import { create } from 'zustand';
import { city } from '../city-network/dataset';
import type { Activity, Plan } from '../citizen-planning/public-api';
import { validateActivity } from '../citizen-planning/public-api';
import type { Incident } from '../aftershock/public-api';
import type { Policy } from '../urban-intelligence/public-api';
import { policyCost } from '../urban-intelligence/public-api';
import {
  defaults,
  loadState,
  saveState,
  type PersistedState,
} from '../../infrastructure/persistence/public-api';

const storage = typeof localStorage === 'undefined' ? undefined : localStorage;
const initial = loadState(storage);
type Store = PersistedState & {
  storageAvailable: boolean;
  selectProfile: (id: string) => void;
  updatePlan: (plan: Plan) => void;
  saveActivity: (activity: Activity) => string;
  removeActivity: (id: string) => void;
  moveActivity: (id: string, delta: number) => void;
  updateIncident: (incident: Incident) => void;
  updatePolicy: (policy: Policy) => void;
  setBudget: (budget: number) => void;
  setObjective: (objective: 'access' | 'equity') => void;
  accept: (order: string[] | null) => void;
  reset: () => void;
};

function persist(state: PersistedState): boolean {
  return saveState(storage, state);
}
export const useScenario = create<Store>((set, get) => ({
  ...initial,
  storageAvailable: storage !== undefined,
  selectProfile: (profile) =>
    set((state) => ({
      profile,
      acceptedOrder: null,
      storageAvailable: persist({ ...state, profile, acceptedOrder: null }),
    })),
  updatePlan: (plan) =>
    set((state) => {
      const next = {
        ...state,
        plans: { ...state.plans, [state.profile]: plan },
        acceptedOrder: null,
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
      const next = { ...state, incident, acceptedOrder: null };
      return { ...next, storageAvailable: persist(next) };
    }),
  updatePolicy: (policy) =>
    set((state) => {
      if (policyCost(policy) > state.budget) return state;
      const next = { ...state, policy };
      return { ...next, storageAvailable: persist(next) };
    }),
  setBudget: (budget) =>
    set((state) => {
      const next = {
        ...state,
        budget,
        policy: policyCost(state.policy) <= budget ? state.policy : defaults().policy,
      };
      return { ...next, storageAvailable: persist(next) };
    }),
  setObjective: (objective) =>
    set((state) => {
      const next = { ...state, objective };
      return { ...next, storageAvailable: persist(next) };
    }),
  accept: (acceptedOrder) =>
    set((state) => {
      const next = { ...state, acceptedOrder };
      return { ...next, storageAvailable: persist(next) };
    }),
  reset: () =>
    set(() => {
      const next = defaults();
      return { ...next, storageAvailable: persist(next) };
    }),
}));
