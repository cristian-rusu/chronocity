import { useMemo } from 'react';
import { city } from '../modules/city-network/public-api';
import { calm } from '../modules/aftershock/public-api';
import { journeyAlternatives } from '../modules/resync/public-api';
import { simulate } from '../modules/temporal-simulation/public-api';
import { useScenario } from '../modules/scenario-management/public-api';

export function useJourney() {
  const profile = useScenario((state) => state.profile);
  const plan = useScenario((state) => state.plans[state.profile]);
  const incident = useScenario((state) => state.incident);
  return useMemo(() => {
    const base = simulate(city, plan, calm, undefined, undefined, 'Original');
    const disrupted = simulate(city, plan, incident, undefined, base, 'Aftershock');
    const candidates = journeyAlternatives(city, plan, incident);
    return { profile, plan, base, disrupted, candidates };
  }, [profile, plan, incident]);
}
