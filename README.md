# ChronoCity

ChronoCity is a focused frontend prototype for **Personal Disruption Recovery**. A commuter selects or customizes a constrained afternoon schedule in a fictional city (Achrona), introduces a timed transport disruption or service closure, inspects the cascading ripple effect on a live map and timeline, and compares feasible recovery routes (rerouting, reordering, or deferring non-essential visits). No accounts, backend, or real travel data are used.

## Develop

Requires Node 24 and npm.

```sh
npm ci
npm run dev
```

The standard Vite commands are `npm run build` and `npm run preview`. Quality commands are `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run architecture:check`, `npm run test`, `npm run test:coverage`, `npm run test:e2e`, and `npm run check`. Playwright also requires `npx playwright install chromium` locally.

## Architecture

React Router provides `/` (overview), `/recovery` (the unified disruption and recovery workspace), and a not-found page. Business calculations live in six feature contexts under `src/contexts`:

- `city-network`: fictional places, transport edges, graph validation, and SVG city map
- `citizen-planning`: activity/plan validation, time formatting, and preset commuter profiles
- `aftershock`: timed connection delay and service closure rules + controls
- `temporal-simulation`: earliest-arrival FIFO routing, multi-stop simulation, journey list, and timeline
- `resync`: bounded permutation/subset recovery search, ranking, and distinct physical route discovery
- `scenario-management`: versioned Zod-validated `localStorage` persistence and Zustand scenario store

See the [architecture overview](docs/architecture/overview.md) for ownership, dependency rules, and model assumptions.

## Limitations

Simulation uses fictional data and local minute-of-day time, with up to six activities per plan, one timed connection delay, and one modeled-day service closure. It does not model transit capacity, congestion, real schedules, or multi-day calendars.
