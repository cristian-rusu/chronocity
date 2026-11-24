import type { Plan } from '../../citizen-planning/public-contracts';
import type { Incident } from '../../aftershock/public-contracts';

export type ScenarioState = {
  version: 1;
  profile: string;
  plans: Record<string, Plan>;
  incident: Incident;
  acceptedOrder: string[] | null;
  acceptedRoutes?: string[][] | null;
};

export interface ScenarioStorage {
  load(): ScenarioState;
  save(state: ScenarioState): boolean;
  defaults(): ScenarioState;
}
