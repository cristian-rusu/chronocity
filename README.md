# ChronoCity

ChronoCity is a static urban time planning demo. A citizen plans obligations in a fictional city, tests a timed transport disruption or service closure, compares recovery routes, and explores municipal interventions across 60 synthetic residents. No accounts, backend, or real travel data are used.

## Develop

Requires Node 24 and npm.

```sh
npm ci
npm run dev
```

The standard Vite commands are `npm run build` and `npm run preview`. Quality commands are `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run architecture:check`, `npm run test`, `npm run test:coverage`, `npm run test:e2e`, and `npm run check`. Playwright also requires `npx playwright install chromium` locally.

## Architecture

React Router provides `/`, `/my-day`, `/aftershock`, `/resync`, `/my-day/accepted`, `/city-lab`, and a not-found page. Business calculations live in `src/modules`, with public entry points named `public-api.ts`. Zustand stores user inputs; simulation results are derived. Local storage is versioned and validated with Zod. See [architecture overview](docs/architecture/overview.md), [module contracts](docs/architecture/module-boundaries.md), [simulation model](docs/architecture/simulation-model.md), [state and persistence](docs/architecture/data-flow.md), [testing](docs/architecture/testing.md), and the [initial audit](docs/architecture/current-state.md).

## Feature inventory

| Feature | Status | Notes |
| --- | --- | --- |
| City map, transport graph, service hours | Implemented but requires correction | Selectable SVG, graph validation; map layers are not restored. |
| Profiles, obligation CRUD, priorities, deadlines, fixed order | Implemented but requires correction | Per-profile plans and validation; editor needs complete dialog focus management. |
| Multi-stop baseline, disruption, cascading conflicts | Implemented but requires correction | Deterministic one-day engine; one edge delay and one closure. |
| Recovery, partial recovery, alternative routes, comparisons | Implemented but requires correction | Bounded six-obligation search; no explicit unreachable/deferred reason taxonomy. |
| Playback and focus preservation | Implemented but requires correction | Local timer and component regression test; map marker and full timeline animation are not restored. |
| Accepted itinerary and calendar export | Partially implemented | Acceptance persists by activity order; route selection and travel events do not persist to ICS. |
| Scenario export | Partially implemented | JSON export exists; import does not. |
| Population metrics and budget optimization | Implemented but requires correction | Computed from 60 synthetic residents and four illustrative policies. |
| Responsive layout and accessibility | Partially implemented | Semantic navigation, focus indicators, labels; further WCAG testing and dialog focus work remain. |
| Real-time transport, bookings, authentication | Deferred to future scope | Outside this frontend-only model. |

## Limitations

Simulation uses fictional data and local minute-of-day time, with no congestion, capacity, date-specific schedules, real policy prices, or forecasts. The old prototype source and generated files remain pending cleanup approval. The old Node and Python smoke tests are retained as references but are not part of the new test command; more feature coverage is required. See the architecture documents for exact algorithm and storage assumptions.
