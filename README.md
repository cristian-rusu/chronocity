# ChronoCity — Reclaim your day

An interactive web prototype for Hack The Future 2026. A fictional city connects daily obligations, transport and service hours. Aftershock models cascading disruptions; Re-Sync generates feasible alternatives; City Lab evaluates municipal policy across a synthetic population.

## Start

- Open `dist/chronocity.html` for the standalone application (browser file-origin storage varies).
- `npm install` then `npm run dev` for source development.
- `npm run preview` serves the included compiled build at localhost:4173.
- `npm test` compiles and runs the Node test suite.
- `npm run build` compiles and creates the static deployment and standalone HTML.

Deploy the contents of `dist/` to a static HTTPS host; included Netlify and Vercel configs point to dist. No secrets, API keys, backend or runtime dependencies are needed.

## Five pages

- **Overview:** explains the problem, audience and value; start the sample disruption or edit a plan.
- **My day:** three editable profiles, independent saved obligations, departure, location, earliest start, arrival/completion deadline, priority and relative-order constraint; CRUD and manual ordering. Baseline is calculated immediately.
- **Aftershock:** select a connection, event window and delay, or close a service for the modeled day. Inspect cascading conflicts, three synchronized timelines, and map layers. The clock updates existing SVG attributes, text and playhead only; it does not recreate controls on ticks. The map inspector does not change the incident unless explicitly requested.
- **Re-Sync:** feasible itinerary permutations/subsets and distinct route alternatives (avoid individual links); rank by essential obligations, total completed, earliest finish and travel time. Accept a complete or explicitly confirmed partial recovery, undo acceptance, see deferred activities, export accepted travel/visits to ICS. Original plan remains intact for comparison.
- **City Lab:** 60 deterministic fictional residents, 180 obligations, four budgeted interventions; two objectives (total access or worst-served group), group-level and resident-level results. Export scenario JSON.

## Model and limitations

TypeScript domain logic is independent from UI. A small weighted undirected graph uses time-dependent edge traversal; a delay applies when entering an affected edge during its window. Service hours, earliest start, duration and deadline constraints are enforced. A blocked visit in the fixed original sequence produces hypothetical downstream times, not completed services; the UI marks these as projections. Re-Sync validates each retained visit and explicitly lists omitted obligations. Max six activities. Citizen route alternatives are bounded; not an exhaustive enumeration of all graph paths. City Lab compares adaptation and policies with the same population model; no capacity, congestion feedback, real data, forecast accuracy or actual bookings. Policy credits are arbitrary illustrative units. Calendar export uses local floating times from the fictional model, not bookings. No live transport or municipal integrations. This is a functional hackathon prototype, not a validated city digital twin.

State is stored locally in the browser. Browser storage failures are reported, not silently ignored. Changes to the plan or incident invalidate previously accepted recovery. No accounts or external transmission.

## Tests

19 engine tests, including distinct route options and invalid locked-path connectivity. Chromium smoke tests cover profile preservation, CRUD, delayed playback focus, controls during playback, recovery acceptance, ICS export, policy optimization and mobile layout. The execution sandbox blocks browser navigation to normal origins, so the UI test used standalone HTML via set_content; real LocalStorage refresh requires checking on deployed HTTPS hosting. The browser smoke script requires Python Playwright and Chromium; see `tests/browser-smoke.py`.
