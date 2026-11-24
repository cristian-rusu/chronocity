# ChronoCity architecture

ChronoCity is a frontend-only prototype. React Router composes pages in `src/pages`; each business context lives under `src/contexts`. The active application starts at `src/main.tsx`. The original single-file prototype is retained in `legacy/` for reference and is excluded from the build.

## Ownership and dependency direction

| Context             | Owns                                                     | Main public entry                         |
| ------------------- | -------------------------------------------------------- | ----------------------------------------- |
| City Network        | Fictional places, connections, graph validation, map UI  | `city-network/public-api.ts`              |
| Citizen Planning    | Activity and plan rules, fictional profiles              | `citizen-planning/public-api.ts`          |
| Aftershock          | Timed incident rules and disruption controls             | `aftershock/public-api.ts`                |
| Temporal Simulation | FIFO routing and journey evaluation                      | `temporal-simulation/public-contracts.ts` |
| Re-Sync             | Feasible journey recovery and ranking                    | `resync/public-api.ts`                    |
| Urban Intelligence  | Synthetic population analysis and budget optimization    | `urban-intelligence/public-api.ts`        |
| Scenario Management | User inputs, accepted order, versioned local persistence | `scenario-management/public-api.ts`       |

Pure domain rules are in `domain/`, application orchestration and ports in `application/`, synthetic and browser adapters in `infrastructure/`, and React code in `presentation/`. Simple contexts omit layers they do not need. Routing is part of Temporal Simulation. Playback is a shared presentation capability, not a business context.

The business dependency graph is acyclic: City Network, Citizen Planning and Aftershock supply contracts to Temporal Simulation; Re-Sync uses simulation; Urban Intelligence uses simulation and recovery; Scenario Management owns user state and consumes those public contracts. Pages compose public UI and contracts. `src/app/model.ts` is the citizen journey workflow, deriving baseline, disruption, and recovery from one scenario snapshot.

`public-contracts.ts` exposes business-facing types and functions without loading synthetic data or React. `public-api.ts` may additionally expose the context's prototype adapter. UI entry points are in `presentation/public-api.ts`. Cross-context imports must use these entries. `npm run architecture:check` rejects deep cross-context imports, outward domain and application dependencies, business context cycles, missing imports, and authored CSS pixel units.

Scenario storage has an application port, `ScenarioStorage`, implemented by a localStorage adapter. The Zustand store is a presentation adapter. Computed journeys and population results are derived rather than persisted. The city graph, profiles, service hours, population cohort, and intervention costs are synthetic; route finding, deadline evaluation, recovery search, group metrics, and budget selection are calculations over that data.

## Prototype limits

The model uses one day of local minute-of-day time, up to six citizen activities, one timed connection delay and one service closure. It does not model capacity, congestion, real schedules, municipal prices, or date-specific calendars. Accepted plans persist by activity order; route selection and travel events are not included in calendar export. Scenario JSON import and full editor dialog focus management remain deferred. The older Node and Python smoke tests in `tests/` target the legacy prototype and are not part of `npm run check`.
