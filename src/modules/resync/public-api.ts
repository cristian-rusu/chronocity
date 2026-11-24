import type { City } from '../city-network/public-api';
import type { Activity, Plan } from '../citizen-planning/public-api';
import type { Incident } from '../aftershock/public-api';
import { simulate, type Result } from '../temporal-simulation/public-api';

function permutations<T>(items: T[]): T[][] {
  return items.length
    ? items.flatMap((item, index) =>
        permutations(items.filter((_, at) => at !== index)).map((rest) => [item, ...rest]),
      )
    : [[]];
}

function permitted(original: Activity[], order: Activity[]): boolean {
  return order.every(
    (activity, index) =>
      !activity.fixedOrder ||
      order.every(
        (other, otherIndex) =>
          original.indexOf(activity) < original.indexOf(other) === index < otherIndex,
      ),
  );
}

function rank(a: Result, b: Result): number {
  return (
    b.essential - a.essential ||
    b.completed - a.completed ||
    a.finish - b.finish ||
    a.travel - b.travel ||
    a.order.join().localeCompare(b.order.join())
  );
}

export function alternatives(city: City, plan: Plan, incident: Incident): Result[] {
  const activities = plan.activities;
  if (!activities.length || activities.length > 6) return [];
  const candidates: Result[] = [];
  for (let mask = 1; mask < 1 << activities.length; mask++) {
    for (const order of permutations(activities.filter((_, index) => mask & (1 << index)))) {
      if (!permitted(activities, order)) continue;
      const label =
        order.length < activities.length
          ? 'Partial recovery'
          : order.every((item, index) => item === activities[index])
            ? 'Reroute'
            : 'Reorder activities';
      const result = simulate(city, plan, incident, order, undefined, label);
      // Independently check hard constraints and the complete obligation inventory.
      if (
        result.steps.every((step) => step.valid) &&
        result.omitted.length + result.steps.length === activities.length
      )
        candidates.push(result);
    }
  }
  return candidates.sort(rank).slice(0, 8);
}

export function journeyAlternatives(city: City, plan: Plan, incident: Incident): Result[] {
  const base = alternatives(city, plan, incident);
  const results = [...base];
  const signature = (result: Result) =>
    result.steps.map((step) => `${step.activity.id}:${step.path?.edges.join(',')}`).join('|');
  const seen = new Set(base.map(signature));
  for (const candidate of base.filter((item) => item.all).slice(0, 3)) {
    const order = candidate.order.flatMap((id) => plan.activities.filter((item) => item.id === id));
    for (const edgeId of new Set(candidate.steps.flatMap((step) => step.path?.edges ?? []))) {
      const reduced = { ...city, edges: city.edges.filter((edge) => edge.id !== edgeId) };
      const rerouted = simulate(reduced, plan, incident, order, undefined, 'Alternative route');
      const key = signature(rerouted);
      if (rerouted.all && !seen.has(key)) {
        seen.add(key);
        results.push(rerouted);
      }
    }
  }
  return results.sort(rank).slice(0, 8);
}
