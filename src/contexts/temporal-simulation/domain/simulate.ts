import type { City } from '../../city-network/public-contracts';
import type { Activity, Plan } from '../../citizen-planning/public-contracts';
import { minutesToTime } from '../../citizen-planning/public-contracts';
import type { Incident } from '../../aftershock/public-contracts';
import { route, type Path } from './route';

export type Step = {
  activity: Activity;
  depart: number;
  arrive: number;
  start: number;
  finish: number;
  wait: number;
  path: Path | null;
  valid: boolean;
  reason: string;
  projected: boolean;
};
export type Result = {
  steps: Step[];
  omitted: Activity[];
  finish: number;
  travel: number;
  wait: number;
  completed: number;
  essential: number;
  all: boolean;
  order: string[];
  label: string;
};

export function simulate(
  city: City,
  plan: Plan,
  incident: Incident,
  order = plan.activities,
  locked?: Result,
  label = 'Scenario',
): Result {
  let cursor = plan.startTime;
  let location = plan.startPlace;
  let travel = 0;
  let wait = 0;
  let blocked = false;
  const steps: Step[] = [];
  for (const activity of order) {
    const destination = city.places.find((place) => place.id === activity.place);
    const path = route(
      city,
      location,
      activity.place,
      cursor,
      incident,
      locked
        ? (locked.steps.find((step) => step.activity.id === activity.id)?.path ?? null)
        : undefined,
    );
    const arrive = cursor + (path?.minutes ?? 0);
    const start = Math.max(arrive, activity.earliest, destination?.open ?? 0);
    const finish = start + activity.duration;
    const reasons: string[] = [];
    if (!path || !destination) reasons.push('No connected route');
    if (incident.closure === activity.place) reasons.push('Service closed');
    if (destination && finish > destination.close)
      reasons.push(`Service closes ${minutesToTime(destination.close)}`);
    if ((activity.deadlineType === 'arrival' ? arrive : finish) > activity.deadline)
      reasons.push(`Deadline ${minutesToTime(activity.deadline)} missed`);
    const valid = reasons.length === 0;
    steps.push({
      activity,
      depart: cursor,
      arrive,
      start,
      finish,
      wait: start - arrive,
      path,
      valid,
      reason: reasons.join(' · '),
      projected: blocked,
    });
    if (!valid) blocked = true;
    cursor = finish;
    location = activity.place;
    travel += path?.minutes ?? 0;
    wait += start - arrive;
  }
  const omitted = plan.activities.filter(
    (activity) => !order.some((item) => item.id === activity.id),
  );
  const confirmed = steps.filter((step) => step.valid && !step.projected);
  return {
    steps,
    omitted,
    finish: cursor,
    travel,
    wait,
    completed: confirmed.length,
    essential: confirmed.filter((step) => step.activity.priority === 'essential').length,
    all: omitted.length === 0 && steps.every((step) => step.valid),
    order: order.map((activity) => activity.id),
    label,
  };
}
