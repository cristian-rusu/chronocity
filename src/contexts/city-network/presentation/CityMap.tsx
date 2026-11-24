import { useState } from 'react';
import { city as defaultCity } from '../infrastructure/dataset';
import type { City, Place } from '../public-contracts';
import type { Result } from '../../temporal-simulation/public-contracts';
import type { Incident } from '../../aftershock/public-contracts';
import { calm, edgeTime } from '../../aftershock/public-api';
import { usePlaybackClock } from '../../../shared/ui/playbackClock';

type Layer = 'routes' | 'access' | 'people';
type Selection = { kind: 'place' | 'edge'; id: string } | null;

const place = (city: City, id: string) => city.places.find((item) => item.id === id)!;
const time = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

function CityGround() {
  return (
    <>
      <rect width="930" height="545" fill="url(#terrainGrad)" />
      {/* Subtle green park pockets */}
      <ellipse cx="430" cy="390" rx="88" ry="44" fill="#d8e9d8" opacity=".68" />
      <ellipse cx="245" cy="120" rx="70" ry="38" fill="#dcebd9" opacity=".55" />
      <ellipse cx="770" cy="245" rx="72" ry="46" fill="#dcead8" opacity=".45" />

      {/* Architectural city blocks */}
      {Array.from({ length: 13 }, (_, i) =>
        Array.from({ length: 8 }, (_, j) => {
          const x = 20 + i * 70 + (j % 2) * 8;
          const y = 18 + j * 65;
          const w = 38 + ((i * 7 + j * 3) % 23);
          const h = 26 + ((i * 5 + j * 7) % 24);
          const isPark = (i + j) % 7 === 0;
          return (
            <rect
              key={`${i}-${j}`}
              x={x}
              y={y}
              width={w}
              height={h}
              rx="4"
              fill={isPark ? '#d9e7d6' : '#e2e6de'}
              stroke={isPark ? '#c6dac4' : '#d2d8ce'}
              strokeWidth=".8"
            />
          );
        }),
      )}
      <rect width="930" height="545" fill="url(#papergrid)" />

      {/* River Achron with shoreline banks & center current */}
      <path
        d="M-20 430 Q170 383 310 448 T610 443 T950 426"
        stroke="#d8e7e4"
        strokeWidth="70"
        fill="none"
        opacity=".65"
      />
      <path
        d="M-20 430 Q170 383 310 448 T610 443 T950 426"
        stroke="url(#riverGrad)"
        strokeWidth="56"
        fill="none"
      />
      <path
        d="M-20 430 Q170 383 310 448 T610 443 T950 426"
        stroke="#eff9fa"
        strokeWidth="2"
        strokeDasharray="10 14"
        fill="none"
        opacity=".55"
      />

      {/* District labels */}
      <g fill="#5b7066" fontSize="11" fontWeight="700" letterSpacing="3.2">
        <text x="38" y="58">
          WESTHAVEN
        </text>
        <text x="365" y="58">
          OLD TOWN
        </text>
        <text x="765" y="58">
          EASTSIDE
        </text>
        <text x="668" y="486" fill="#4f7478">
          RIVER ACHRON
        </text>
      </g>
    </>
  );
}

function TransportLayer({
  city,
  result,
  incident,
  selected,
  hovered,
  highlightedPlaceId,
  select,
  onHover,
  hero,
}: {
  city: City;
  result: Result;
  incident: Incident;
  selected: Selection;
  hovered: Selection;
  highlightedPlaceId?: string | null;
  select: (value: Selection) => void;
  onHover: (value: Selection) => void;
  hero: boolean;
}) {
  const used = new Set(
    hero
      ? ['west-central', 'central-hall', 'hall-child', 'work-park', 'park-child', 'child-pharmacy']
      : result.steps.flatMap((step) => step.path?.edges ?? []),
  );

  const highlightedEdges = new Set(
    highlightedPlaceId
      ? result.steps
          .filter((step) => step.activity.place === highlightedPlaceId)
          .flatMap((step) => step.path?.edges ?? [])
      : [],
  );

  return (
    <g>
      {city.edges.map((edge) => {
        const a = place(city, edge.a);
        const b = place(city, edge.b);
        const affected = hero
          ? edge.id === 'central-hall'
          : incident.delay > 0 && edge.id === incident.edge;
        const active = used.has(edge.id);
        const isShuttle = edge.id === 'shuttle';
        const isSelected = !hero && selected?.kind === 'edge' && selected.id === edge.id;
        const isHovered = !hero && hovered?.kind === 'edge' && hovered.id === edge.id;
        const isHighlighted = !hero && highlightedEdges.has(edge.id);
        const emphasized = isSelected || isHovered || isHighlighted;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;

        return (
          <g
            key={edge.id}
            className={hero ? undefined : 'map-target'}
            role={hero ? undefined : 'button'}
            tabIndex={hero ? undefined : 0}
            aria-label={`${a.name} to ${b.name}, ${edge.mode}, ${edge.minutes} minutes${affected ? `, ${incident.delay} minute delay` : ''}${active ? ', part of active journey' : ''}`}
            onClick={hero ? undefined : () => select({ kind: 'edge', id: edge.id })}
            onMouseEnter={hero ? undefined : () => onHover({ kind: 'edge', id: edge.id })}
            onMouseLeave={hero ? undefined : () => onHover(null)}
            onFocus={hero ? undefined : () => onHover({ kind: 'edge', id: edge.id })}
            onBlur={hero ? undefined : () => onHover(null)}
            onKeyDown={
              hero
                ? undefined
                : (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      select({ kind: 'edge', id: edge.id });
                    }
                  }
            }
          >
            <title>
              {a.name} – {b.name} · {edge.mode} · {edge.minutes} min
            </title>

            {/* Road casing */}
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={emphasized ? '#dff3e9' : '#fafaf6'}
              strokeWidth={emphasized ? '16' : '12'}
              strokeLinecap="round"
            />

            {/* Soft glow under active/affected/focused edges */}
            {(active || affected || emphasized) && (
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={affected ? '#d94b39' : emphasized ? '#7b4ab9' : '#088d76'}
                strokeWidth={emphasized ? '11' : '9'}
                strokeLinecap="round"
                opacity={emphasized ? '.26' : '.16'}
              />
            )}

            {/* Primary transport stroke */}
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className={affected ? 'edge-disrupted' : active ? 'edge-active' : undefined}
              stroke={
                affected
                  ? '#d94b39'
                  : emphasized
                    ? '#6d44b2'
                    : active
                      ? '#077d69'
                      : isShuttle
                        ? '#7951ae'
                        : '#97a59c'
              }
              strokeWidth={emphasized ? 5.6 : active || affected ? 4.8 : isShuttle ? 3.5 : 2.4}
              strokeLinecap="round"
              strokeDasharray={affected ? '9 5' : active || isShuttle ? undefined : '3 6'}
            />

            {/* Subtle luminous flow overlay on active non-disrupted route */}
            {active && !affected && !hero && (
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className="edge-flow"
                stroke="#bdf5d3"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeDasharray="4 14"
                pointerEvents="none"
              />
            )}

            {/* Generous invisible hit target for easy clicking */}
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth="24" />

            {/* Disruption badge */}
            {affected && (
              <g transform={`translate(${mx},${my})`} filter="url(#mapshadow)">
                <rect x="-34" y="-13" width="68" height="26" rx="13" fill="#d94b39" />
                <text textAnchor="middle" y="4" fill="white" fontSize="11.5" fontWeight="750">
                  +{hero ? 30 : incident.delay}m
                </text>
              </g>
            )}

            {/* Compact mode + travel-time pill on active or hovered links */}
            {!hero && !affected && (active || emphasized) && (
              <g transform={`translate(${mx},${my})`} pointerEvents="none" filter="url(#pillshadow)">
                <rect
                  x="-34"
                  y="-11"
                  width="68"
                  height="22"
                  rx="11"
                  fill={emphasized ? '#6d44b2' : '#ffffff'}
                  stroke={emphasized ? '#6d44b2' : '#96c9b4'}
                  strokeWidth="1.2"
                />
                <text
                  textAnchor="middle"
                  y="3.5"
                  fill={emphasized ? '#ffffff' : '#10493c'}
                  fontSize="9.5"
                  fontWeight="750"
                >
                  {edge.mode} · {edge.minutes}m
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

function LocationLayer({
  city,
  result,
  incident,
  layer,
  selected,
  hovered,
  highlightedPlaceId,
  startPlaceId,
  select,
  onHover,
  hero,
}: {
  city: City;
  result: Result;
  incident: Incident;
  layer: Layer;
  selected: Selection;
  hovered: Selection;
  highlightedPlaceId?: string | null;
  startPlaceId?: string;
  select: (value: Selection) => void;
  onHover: (value: Selection) => void;
  hero: boolean;
}) {
  const clock = usePlaybackClock((state) => state.time);
  const conflicts = new Set(
    result.steps.filter((step) => !step.valid).map((step) => step.activity.place),
  );

  // Map placeId -> list of 1-based step indices in the active journey
  const stopNumbers = new Map<string, number[]>();
  result.steps.forEach((step, idx) => {
    const list = stopNumbers.get(step.activity.place) ?? [];
    list.push(idx + 1);
    stopNumbers.set(step.activity.place, list);
  });

  const inferredStart = startPlaceId ?? result.steps[0]?.path?.nodes[0];

  return (
    <g>
      {city.places.map((item) => {
        const numbers = stopNumbers.get(item.id) ?? [];
        const isScheduled = numbers.length > 0;
        const isStart = !hero && inferredStart === item.id;
        const isOpen =
          item.open === 0 ||
          (clock >= item.open && clock < item.close && incident.closure !== item.id);
        const isConflict = conflicts.has(item.id);
        const isClosed = incident.closure === item.id;
        const isSelected = !hero && selected?.kind === 'place' && selected.id === item.id;
        const isHovered = !hero && hovered?.kind === 'place' && hovered.id === item.id;
        const isHighlighted = !hero && highlightedPlaceId === item.id;
        const emphasized = isSelected || isHovered || isHighlighted;

        const color =
          isConflict || isClosed || (layer === 'access' && !isOpen)
            ? '#d94b39'
            : isScheduled
              ? '#077d69'
              : isStart
                ? '#153b31'
                : '#647d73';

        return (
          <g key={item.id}>
            {layer === 'access' && item.open > 0 && (
              <circle
                cx={item.x}
                cy={item.y}
                r="62"
                fill={isOpen ? '#087c67' : '#d94b39'}
                opacity=".1"
                pointerEvents="none"
              />
            )}

            <g
              className={hero ? undefined : 'map-target'}
              role={hero ? undefined : 'button'}
              tabIndex={hero ? undefined : 0}
              aria-label={`${item.name}, ${item.kind}${isStart ? ', starting point' : ''}${isScheduled ? `, stop ${numbers.join(', ')}` : ''}${isConflict ? ', conflict' : ''}`}
              onClick={hero ? undefined : () => select({ kind: 'place', id: item.id })}
              onMouseEnter={hero ? undefined : () => onHover({ kind: 'place', id: item.id })}
              onMouseLeave={hero ? undefined : () => onHover(null)}
              onFocus={hero ? undefined : () => onHover({ kind: 'place', id: item.id })}
              onBlur={hero ? undefined : () => onHover(null)}
              onKeyDown={
                hero
                  ? undefined
                  : (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        select({ kind: 'place', id: item.id });
                      }
                    }
              }
            >
              {/* Conflict pulse halo */}
              {(isConflict || isClosed) && (
                <circle
                  cx={item.x}
                  cy={item.y}
                  r="24"
                  fill="none"
                  stroke="#d94b39"
                  strokeWidth="2.2"
                  className="node-conflict-pulse"
                  pointerEvents="none"
                />
              )}

              {/* Hover / focus / spotlight halo */}
              {emphasized && (
                <circle
                  cx={item.x}
                  cy={item.y}
                  r="25"
                  fill={isConflict ? '#d94b39' : '#6d44b2'}
                  opacity=".18"
                  pointerEvents="none"
                />
              )}

              {/* Outer node ring */}
              <circle
                cx={item.x}
                cy={item.y}
                r={isScheduled || isStart ? 17 : 12}
                fill="#ffffff"
                stroke={emphasized ? '#6d44b2' : color}
                strokeWidth={emphasized ? 3.5 : isScheduled || isStart ? 3 : 1.8}
                filter="url(#pillshadow)"
              />

              {/* Inner node core or stop number */}
              {!hero && isScheduled ? (
                <>
                  <circle cx={item.x} cy={item.y} r="11" fill={color} />
                  <text
                    x={item.x}
                    y={item.y + 4}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="800"
                    fill="#ffffff"
                  >
                    {numbers[0]}
                  </text>
                </>
              ) : !hero && isStart ? (
                <>
                  <circle cx={item.x} cy={item.y} r="9.5" fill="#153b31" />
                  <circle cx={item.x} cy={item.y} r="3.5" fill="#cbf7ac" />
                </>
              ) : (
                <circle cx={item.x} cy={item.y} r={isScheduled ? 7 : 4.2} fill={color} />
              )}

              {/* Origin pill above start node */}
              {!hero && isStart && !isScheduled && (
                <g transform={`translate(${item.x},${item.y - 26})`} pointerEvents="none">
                  <rect x="-24" y="-9" width="48" height="17" rx="8.5" fill="#153b31" />
                  <text
                    y="2.5"
                    textAnchor="middle"
                    fontSize="8.5"
                    fontWeight="800"
                    letterSpacing=".8"
                    fill="#d2faa9"
                  >
                    START
                  </text>
                </g>
              )}

              {/* Location label card */}
              <g transform={`translate(${item.x},${item.y + 22})`} filter="url(#mapshadow)">
                <rect
                  x="-59"
                  y="-1"
                  width="118"
                  height="33"
                  rx="7"
                  fill={emphasized ? '#f5f0fc' : '#fffefa'}
                  stroke={emphasized ? '#7d52bd' : isConflict ? '#ebb7ac' : '#e0e6dc'}
                  strokeWidth={emphasized ? '1.4' : '.9'}
                />
                <text y="12.5" textAnchor="middle" fontSize="11" fontWeight="750" fill="#132924">
                  {item.name}
                </text>
                <text
                  y="24.5"
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="600"
                  fill={isConflict || isClosed ? '#b63b2d' : '#52675d'}
                >
                  {isClosed
                    ? 'Closed (disruption)'
                    : layer === 'access' && item.open > 0
                      ? isOpen
                        ? `Open · ${time(item.close)}`
                        : 'Closed'
                      : item.open > 0
                        ? `Closes ${time(item.close)}`
                        : item.kind}
                </text>
              </g>
            </g>
          </g>
        );
      })}
    </g>
  );
}

function citizenPosition(
  city: City,
  result: Result,
  clock: number,
  incident: Incident,
): Pick<Place, 'x' | 'y'> | null {
  const step = result.steps.find((item) => clock >= item.depart && clock < item.finish);
  if (!step?.path) return null;
  if (clock >= step.arrive) return place(city, step.activity.place);
  let cursor = step.depart;
  for (let index = 0; index < step.path.edges.length; index++) {
    const edge = city.edges.find((item) => item.id === step.path!.edges[index]);
    if (!edge) return null;
    const a = place(city, step.path.nodes[index]);
    const b = place(city, step.path.nodes[index + 1]);
    const duration = edgeTime(edge, cursor, incident);
    if (clock < cursor + duration) {
      const fraction = (clock - cursor) / duration;
      return { x: a.x + (b.x - a.x) * fraction, y: a.y + (b.y - a.y) * fraction };
    }
    cursor += duration;
  }
  return place(city, step.activity.place);
}

function CitizenLayer({
  city,
  result,
  incident,
  layer,
  residents,
}: {
  city: City;
  result: Result;
  incident: Incident;
  layer: Layer;
  residents: Result[];
}) {
  const clock = usePlaybackClock((state) => state.time);
  const point = citizenPosition(city, result, clock, incident);
  if (!point && (layer !== 'people' || residents.length === 0)) return null;
  return (
    <g pointerEvents="none" className="citizen">
      {layer === 'people' &&
        residents.map((resident, index) => {
          const location = citizenPosition(city, resident, clock, incident);
          return (
            location && (
              <circle
                key={index}
                cx={location.x + ((index % 5) - 2) * 4}
                cy={location.y + ((index % 7) - 3) * 3}
                r="4.5"
                fill={['#087e6b', '#7951ae', '#e07b4f'][index % 3]}
                stroke="#263e38"
                strokeWidth=".8"
              />
            )
          );
        })}
      {point && (
        <g>
          <circle
            cx={point.x}
            cy={point.y}
            r="14"
            fill="#0a937b"
            opacity=".22"
            className="citizen-ping"
          />
          <circle
            cx={point.x}
            cy={point.y}
            r="8.5"
            fill="#132924"
            stroke="#d2faa9"
            strokeWidth="2.8"
          />
        </g>
      )}
    </g>
  );
}

function LocationStatus({ place, incident }: { place: Place; incident: Incident }) {
  const clock = usePlaybackClock((state) => state.time);
  const open =
    place.open === 0 || (clock >= place.open && clock < place.close && incident.closure !== place.id);
  return <>{open ? 'Open at current clock' : 'Closed at current clock'}</>;
}

export function CityMap({
  result,
  incident = calm,
  onSelectEdge,
  onSelectPlace,
  highlightedPlaceId = null,
  startPlaceId,
  hero = false,
  cityData = defaultCity,
  residentResults = [],
  compactControls = false,
  title,
  kicker,
}: {
  result: Result;
  incident?: Incident;
  onSelectEdge?: (id: string) => void;
  onSelectPlace?: (id: string | null) => void;
  highlightedPlaceId?: string | null;
  startPlaceId?: string;
  hero?: boolean;
  cityData?: City;
  residentResults?: Result[];
  compactControls?: boolean;
  title?: string;
  kicker?: string;
}) {
  const city = cityData;
  const [selected, setSelected] = useState<Selection>(null);
  const [hovered, setHovered] = useState<Selection>(null);
  const [layer, setLayer] = useState<Layer>(cityData === defaultCity ? 'routes' : 'people');
  const [showLayers, setShowLayers] = useState(false);

  const availableLayers: Layer[] =
    compactControls && residentResults.length === 0
      ? ['routes', 'access']
      : ['routes', 'access', 'people'];

  const handleSelect = (next: Selection) => {
    setSelected(next);
    if (onSelectPlace) {
      onSelectPlace(next?.kind === 'place' ? next.id : null);
    }
  };

  // Prefer hovered item for live preview, fall back to clicked selection or externally highlighted place
  const inspected: Selection =
    hovered ?? selected ?? (highlightedPlaceId ? { kind: 'place', id: highlightedPlaceId } : null);

  const inspectedEdge =
    inspected?.kind === 'edge' ? city.edges.find((edge) => edge.id === inspected.id) : undefined;
  const inspectedPlace =
    inspected?.kind === 'place' ? city.places.find((item) => item.id === inspected.id) : undefined;
  const inspectedStep = inspectedPlace
    ? result.steps.find((step) => step.activity.place === inspectedPlace.id)
    : undefined;
  const inspectedStepIdx = inspectedPlace
    ? result.steps.findIndex((step) => step.activity.place === inspectedPlace.id)
    : -1;

  const headingTitle =
    title ?? (cityData === defaultCity ? 'Your route in the city' : 'City activity');
  const headingKicker = kicker ?? 'ACHRONA / SYNTHETIC DISTRICT';
  const hasActiveDisruption = incident.delay > 0 || Boolean(incident.closure);
  const hasShuttle = city.edges.some((edge) => edge.id === 'shuttle');

  return (
    <section
      className={hero ? 'hero-map-container' : 'panel map-panel'}
      aria-label="Achrona city map"
    >
      {!hero && (
        <div className="panel-heading">
          <div>
            <div className="kicker">{headingKicker}</div>
            <h2>{headingTitle}</h2>
          </div>
          {compactControls ? (
            <div className="map-head-controls">
              {showLayers && (
                <div className="segmented" aria-label="Map layer">
                  {availableLayers.map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={layer === value}
                      onClick={() => setLayer(value)}
                    >
                      {value === 'routes'
                        ? 'Route'
                        : value === 'access'
                          ? 'Open hours'
                          : 'Residents'}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                className="btn small"
                aria-expanded={showLayers}
                onClick={() => setShowLayers((open) => !open)}
              >
                {showLayers ? 'Hide layers' : 'Map layers'}
              </button>
            </div>
          ) : (
            <div className="segmented" aria-label="Map layer">
              {availableLayers.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={layer === value}
                  onClick={() => setLayer(value)}
                >
                  {value === 'routes' ? 'Network' : value === 'access' ? 'Open hours' : 'Residents'}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="map-wrap">
        <svg
          viewBox="0 0 930 545"
          role={hero ? 'img' : 'group'}
          aria-label="Illustrated Achrona city with districts, river, services and transport"
          className={hero ? 'city-map hero-map' : 'city-map'}
        >
          <defs>
            <linearGradient id="terrainGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#eff3eb" />
              <stop offset="55%" stopColor="#ecefe7" />
              <stop offset="100%" stopColor="#e6ede8" />
            </linearGradient>
            <linearGradient id="riverGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#bddadd" />
              <stop offset="50%" stopColor="#b2d3d8" />
              <stop offset="100%" stopColor="#c1dfe1" />
            </linearGradient>
            <pattern id="papergrid" width="35" height="35" patternUnits="userSpaceOnUse">
              <path d="M35 0H0V35" fill="none" stroke="#9aaea2" strokeWidth=".55" opacity=".32" />
            </pattern>
            <filter id="mapshadow">
              <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#102b24" floodOpacity=".14" />
            </filter>
            <filter id="pillshadow">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#102b24" floodOpacity=".12" />
            </filter>
          </defs>

          <CityGround />
          <TransportLayer
            city={city}
            result={result}
            incident={incident}
            selected={selected}
            hovered={hovered}
            highlightedPlaceId={highlightedPlaceId}
            select={handleSelect}
            onHover={setHovered}
            hero={hero}
          />
          <LocationLayer
            city={city}
            result={result}
            incident={incident}
            layer={layer}
            selected={selected}
            hovered={hovered}
            highlightedPlaceId={highlightedPlaceId}
            startPlaceId={startPlaceId}
            select={handleSelect}
            onHover={setHovered}
            hero={hero}
          />
          {!hero && (
            <CitizenLayer
              city={city}
              result={result}
              incident={incident}
              layer={layer}
              residents={residentResults}
            />
          )}
          <g transform="translate(888,24)">
            <circle cx="8" cy="14" r="16" fill="#fffefa" opacity=".82" />
            <path d="M3 22 8 4 13 22 8 17z" fill="#3e5950" />
            <text x="8" y="37" fontSize="9" fontWeight="700" textAnchor="middle" fill="#465f56">
              N
            </text>
          </g>
        </svg>

        {/* Clear visual legend explaining every dot & line */}
        {!hero && (
          <div className="map-legend" aria-label="Map legend">
            <span className="legend-item">
              <span className="legend-line active" /> Active route
            </span>
            <span className="legend-item">
              <span className="legend-line dashed" /> Other transit link
            </span>
            <span className="legend-item">
              <span className="legend-dot numbered">1</span> Scheduled stop
            </span>
            <span className="legend-item">
              <span className="legend-dot origin" /> Start / You
            </span>
            <span className="legend-item">
              <span className="legend-dot minor" /> City location
            </span>
            {(hasActiveDisruption || cityData !== defaultCity) && (
              <span className="legend-item">
                <span className="legend-line disrupted" /> Disruption / conflict
              </span>
            )}
            {hasShuttle && (
              <span className="legend-item">
                <span className="legend-line shuttle" /> Added shuttle
              </span>
            )}
            {residentResults.length > 0 && layer === 'people' && (
              <span className="legend-item">
                <span className="legend-dot residents" /> 60 residents
              </span>
            )}
          </div>
        )}
      </div>

      {/* Rich interactive inspector for hovered / focused / clicked map elements */}
      {!hero && (
        <div className="map-inspector" aria-live="polite">
          {inspectedEdge ? (
            <>
              <span className="inspector-badge edge">
                {inspectedEdge.mode} · {inspectedEdge.minutes} min
              </span>
              <strong>
                {place(city, inspectedEdge.a).name} ↔ {place(city, inspectedEdge.b).name}
              </strong>
              <span>
                {result.steps.some((step) => step.path?.edges.includes(inspectedEdge.id))
                  ? 'Used in your active route'
                  : 'Available network connection'}
                {incident.edge === inspectedEdge.id && incident.delay > 0
                  ? ` · +${incident.delay} min active delay`
                  : ''}
              </span>
              {onSelectEdge && (
                <button
                  className="btn small"
                  type="button"
                  onClick={() => onSelectEdge(inspectedEdge.id)}
                >
                  Disrupt this link
                </button>
              )}
            </>
          ) : inspectedPlace ? (
            <>
              <span
                className={`inspector-badge ${inspectedStep ? (inspectedStep.valid ? 'stop' : 'conflict') : 'place'}`}
              >
                {inspectedStep
                  ? `Stop ${inspectedStepIdx + 1}`
                  : startPlaceId === inspectedPlace.id
                    ? 'Start'
                    : inspectedPlace.kind}
              </span>
              <strong>{inspectedPlace.name}</strong>
              <span>
                {inspectedPlace.open
                  ? `Open ${time(inspectedPlace.open)}–${time(inspectedPlace.close)}`
                  : 'Always accessible'}{' '}
                · <LocationStatus place={inspectedPlace} incident={incident} />
                {inspectedStep
                  ? ` · ${inspectedStep.activity.title} (${time(inspectedStep.start)}–${time(inspectedStep.finish)})`
                  : ''}
              </span>
              {selected && (
                <button
                  type="button"
                  className="btn small"
                  onClick={() => handleSelect(null)}
                >
                  Clear selection
                </button>
              )}
            </>
          ) : (
            <span>
              {onSelectEdge
                ? 'Hover, focus or click any dot or line on the map to see its mode, travel time, opening hours — or click a link to disrupt it.'
                : 'Hover, focus or click any dot or line on the map — or click an obligation on the right — to inspect stops, routes and opening hours.'}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
