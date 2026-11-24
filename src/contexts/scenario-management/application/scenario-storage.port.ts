import type { Plan } from '../../citizen-planning/public-contracts';
import type { Incident } from '../../aftershock/public-contracts';
import type { Policy } from '../../urban-intelligence/public-api';

export type ScenarioState = {
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

export interface ScenarioStorage {
  load(): ScenarioState;
  save(state: ScenarioState): boolean;
  defaults(): ScenarioState;
}
