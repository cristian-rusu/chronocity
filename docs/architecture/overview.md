# ChronoCity architecture

ChronoCity is a focused frontend-only prototype centered on **Personal Disruption Recovery**. React Router composes `/` (Overview), `/recovery` (the unified recovery workspace), and `*` (Not Found) in `src/pages`; each business context lives under `src/contexts`. The active application starts at `src/main.tsx`.

## Ownership and dependency direction

| Context             | Owns                                                        | Main public entry                         |
| ------------------- | ----------------------------------------------------------- | ----------------------------------------- |
| City Network        | Fictional places, connections, graph validation, map UI     | `city-network/public-api.ts`              |
| Citizen Planning    | Activity and plan rules, fictional commuter profiles        | `citizen-planning/public-api.ts`          |
| Aftershock          | Timed incident rules and disruption controls                | `aftershock/public-api.ts`                |
| Temporal Simulation | FIFO routing, journey evaluation, journey & timeline views  | `temporal-simulation/public-contracts.ts` |
| Re-Sync             | Feasible journey recovery and ranking                       | `resync/public-api.ts`                    |
| Scenario Management | User inputs, accepted recovery, versioned local persistence | `scenario-management/public-api.ts`       |

Pure domain rules are in `domain/`, application ports in `application/`, synthetic and browser adapters in `infrastructure/`, and React code in `presentation/`. Simple contexts omit layers they do not need. Routing is part of Temporal Simulation. Playback (`src/shared/ui/Playback.tsx` and `playbackClock.ts`) and `OriginalIcon` are shared presentation capabilities, not business contexts.

The business dependency graph is acyclic: City Network, Citizen Planning, and Aftershock supply contracts to Temporal Simulation; Re-Sync uses simulation; Scenario Management owns user state and consumes those public contracts. Pages compose public UI and contracts. `src/app/model.ts` derives baseline, disrupted, and recovery candidates from one scenario snapshot.

`public-contracts.ts` exposes business-facing types and functions without loading synthetic data or React. `public-api.ts` may additionally expose the context's prototype adapter. UI entry points are in `presentation/public-api.ts`. Cross-context imports must use these entries. `npm run architecture:check` rejects deep cross-context imports, outward domain and application dependencies, business context cycles, missing imports, and authored CSS pixel units under `src/`.

Scenario storage has an application port, `ScenarioStorage`, implemented by a Zod-validated `localStorage` adapter. The Zustand store is a presentation adapter. Computed journeys are derived rather than persisted.

## Prototype limits

The model uses one day of local minute-of-day time, up to six citizen activities, one timed connection delay, and one service closure. It does not model capacity, congestion, real schedules, or multi-day calendars.
