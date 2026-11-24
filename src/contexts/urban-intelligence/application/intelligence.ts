import { city } from '../../city-network/public-api';
import type { City } from '../../city-network/public-api';
import { profiles } from '../../citizen-planning/public-api';
import type { Plan } from '../../citizen-planning/public-api';
import { calm, type Incident } from '../../aftershock/public-api';
import { simulate } from '../../temporal-simulation/public-api';
import { alternatives } from '../../resync/public-api';
export type Policy = { shuttle: boolean; lateHall: boolean; lateChild: boolean; extraBus: boolean };
export const blankPolicy: Policy = {
  shuttle: false,
  lateHall: false,
  lateChild: false,
  extraBus: false,
};
export const policyOptions = [
  {
    id: 'shuttle',
    title: 'Emergency shuttle',
    description: 'Open a direct Westhaven → City Hall connection.',
    cost: 3,
  },
  {
    id: 'lateHall',
    title: 'Late public service',
    description: 'Extend City Hall by 60 minutes.',
    cost: 2,
  },
  {
    id: 'lateChild',
    title: 'Childcare buffer',
    description: 'Extend facility hours by 30 minutes (personal deadlines stay fixed).',
    cost: 2,
  },
  {
    id: 'extraBus',
    title: 'Express bus',
    description: 'Reduce River Park → Little Oaks travel by 5 minutes.',
    cost: 2,
  },
] as const;
export const policyCost = (p: Policy) =>
  policyOptions.reduce((s, x) => s + (p[x.id] ? x.cost : 0), 0);
export function network(p: Policy): City {
  return {
    places: city.places.map((x) => ({
      ...x,
      close:
        x.close + (x.id === 'hall' && p.lateHall ? 60 : x.id === 'child' && p.lateChild ? 30 : 0),
    })),
    edges: [
      ...city.edges.map((e) => ({
        ...e,
        minutes: e.minutes - (e.id === 'park-child' && p.extraBus ? 5 : 0),
      })),
      ...(p.shuttle ? [{ id: 'shuttle', a: 'work', b: 'hall', minutes: 18, mode: 'Shuttle' }] : []),
    ],
  };
}
export type Citizen = { id: string; name: string; group: string; plan: Plan };
export const cohort: Citizen[] = Array.from({ length: 60 }, (_, j) => {
  const base = profiles[j % 3];
  const plan: Plan = JSON.parse(JSON.stringify(base.plan));
  const offset = ((Math.floor(j / 3) % 10) - 4) * 5;
  plan.startTime += offset;
  plan.activities = plan.activities.map((a, k) => ({
    ...a,
    duration: Math.max(5, a.duration + (((j + k) % 3) - 1) * 3),
    deadline: a.deadline + (a.place === 'child' ? (j % 3) * 5 : 0),
  }));
  if (j % 5 === 0) plan.startPlace = 'home';
  return { id: `c${j}`, name: `${base.name} ${Math.floor(j / 3) + 1}`, group: base.role, plan };
});
export function population(i: Incident, p: Policy) {
  const c = network(p);
  const rows = cohort.map((x) => {
    const base = simulate(city, x.plan, calm);
    const disrupted = simulate(city, x.plan, i, undefined, base);
    const adapt = alternatives(city, x.plan, i)[0];
    const improved = alternatives(c, x.plan, i)[0];
    return { ...x, base, disrupted, adapt, improved };
  });
  const metric = (key: 'base' | 'disrupted' | 'adapt' | 'improved') => {
    const total = rows.reduce((s, r) => s + r.plan.activities.length, 0);
    const done = rows.reduce((s, r) => s + (r[key]?.completed ?? 0), 0);
    return {
      done,
      total,
      percent: Math.round((done / total) * 100),
      complete: rows.filter((r) => r[key]?.all).length,
    };
  };
  const groups = profiles.map((x) => {
    const members = rows.filter((r) => r.group === x.role);
    const rate = (key: 'base' | 'disrupted' | 'adapt' | 'improved') =>
      Math.round(
        (members.reduce((s, r) => s + (r[key]?.completed ?? 0), 0) /
          members.reduce((s, r) => s + r.plan.activities.length, 0)) *
          100,
      );
    return {
      name: x.role,
      baseline: rate('base'),
      disrupted: rate('disrupted'),
      adapt: rate('adapt'),
      improved: rate('improved'),
    };
  });
  const gap = (key: 'adapt' | 'improved') =>
    Math.max(...groups.map((g) => g[key])) - Math.min(...groups.map((g) => g[key]));
  return {
    rows,
    base: metric('base'),
    disrupted: metric('disrupted'),
    adapt: metric('adapt'),
    improved: metric('improved'),
    groups,
    gapBefore: gap('adapt'),
    gapAfter: gap('improved'),
    affected: rows.filter((r) => r.base.completed > r.disrupted.completed).length,
  };
}

export function optimize(
  incident: Incident,
  budget: number,
  objective: 'access' | 'equity',
): Policy {
  let best = { ...blankPolicy };
  let bestScore = -Infinity;
  let bestCost = Infinity;
  for (let mask = 0; mask < 1 << policyOptions.length; mask++) {
    const candidate = { ...blankPolicy };
    policyOptions.forEach((option, index) => {
      candidate[option.id] = Boolean(mask & (1 << index));
    });
    const cost = policyCost(candidate);
    if (cost > budget) continue;
    const result = population(incident, candidate);
    const score =
      objective === 'access'
        ? result.improved.done * 1000 - result.gapAfter
        : Math.min(...result.groups.map((group) => group.improved)) * 100000 +
          result.improved.done * 100 -
          result.gapAfter;
    if (score > bestScore || (score === bestScore && cost < bestCost)) {
      best = candidate;
      bestScore = score;
      bestCost = cost;
    }
  }
  return best;
}
