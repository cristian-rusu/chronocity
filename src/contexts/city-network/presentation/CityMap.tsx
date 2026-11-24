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
      <rect width="930" height="545" fill="#f0f1e9" />
      {Array.from({ length: 13 }, (_, i) =>
        Array.from({ length: 8 }, (_, j) => {
          const x = 20 + i * 70 + (j % 2) * 8;
          const y = 18 + j * 65;
          const w = 38 + ((i * 7 + j * 3) % 23);
          const h = 26 + ((i * 5 + j * 7) % 24);
          return (
            <rect
              key={`${i}-${j}`}
              x={x}
              y={y}
              width={w}
              height={h}
              rx="3"
              fill={(i + j) % 7 === 0 ? '#e3ebdc' : '#e5e5df'}
              stroke="#d6dad0"
              strokeWidth=".7"
            />
          );
        }),
      )}
      <rect width="930" height="545" fill="url(#papergrid)" />
      <path
        d="M-20 430 Q170 383 310 448 T610 443 T950 426"
        stroke="#c8dedf"
        strokeWidth="58"
        fill="none"
      />
      <path
        d="M-20 430 Q170 383 310 448 T610 443 T950 426"
        stroke="#a6cdd0"
        strokeWidth="1.5"
        fill="none"
      />
      <g fill="#718277" fontSize="11" fontWeight="700" letterSpacing="3">
        <text x="38" y="65">
          WESTHAVEN
        </text>
        <text x="365" y="65">
          OLD TOWN
        </text>
        <text x="765" y="65">
          EASTSIDE
        </text>
        <text x="670" y="486">
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
  select,
  hero,
}: {
  city: City;
  result: Result;
  incident: Incident;
  select: (value: Selection) => void;
  hero: boolean;
}) {
  const used = new Set(hero ? ['west-central','central-hall','hall-child','work-park','park-child','child-pharmacy'] : result.steps.flatMap((step) => step.path?.edges ?? []));
  return (
    <g>
      {city.edges.map((edge) => {
        const a = place(city, edge.a),
          b = place(city, edge.b);
        const affected = hero ? edge.id === 'central-hall' : incident.delay > 0 && edge.id === incident.edge;
        const active = used.has(edge.id);
        return (
          <g
            key={edge.id}
            className={hero ? undefined : 'map-target'}
            role={hero ? undefined : 'button'}
            tabIndex={hero ? undefined : 0}
            aria-label={`${a.name} to ${b.name}, ${edge.mode}, ${edge.minutes} minutes${affected ? `, ${incident.delay} minute delay` : ''}`}
            onClick={hero ? undefined : () => select({ kind: 'edge', id: edge.id })}
            onKeyDown={
              hero
                ? undefined
                : (event) => {
                    if (event.key === 'Enter' || event.key === ' ')
                      select({ kind: 'edge', id: edge.id });
                  }
            }
          >
            <title>
              {a.name} – {b.name} · {edge.mode} · {edge.minutes} min
            </title>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#fafaf7"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={
                affected
                  ? '#d94b39'
                  : active
                    ? '#087e6b'
                    : edge.id === 'shuttle'
                      ? '#7951ae'
                      : '#a4afa7'
              }
              strokeWidth={active || affected ? 4.7 : 2.4}
              strokeLinecap="round"
              strokeDasharray={affected ? '8 5' : active ? undefined : '2 6'}
            />
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth="22" />
            {affected && (
              <g transform={`translate(${(a.x + b.x) / 2},${(a.y + b.y) / 2})`}>
                <rect x="-32" y="-13" width="64" height="26" rx="13" fill="#d94b39" />
                <text textAnchor="middle" y="4" fill="white" fontSize="12" fontWeight="700">
                  +{hero ? 30 : incident.delay}m
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
  select,
  hero,
}: {
  city: City;
  result: Result;
  incident: Incident;
  layer: Layer;
  select: (value: Selection) => void;
  hero: boolean;
}) {
  const clock = usePlaybackClock((state) => state.time);
  const conflicts = new Set(
    result.steps.filter((step) => !step.valid).map((step) => step.activity.place),
  );
  return (
    <g>
      {city.places.map((item) => {
        const active = result.steps.some((step) => step.activity.place === item.id);
        const isOpen =
          item.open === 0 ||
          (clock >= item.open && clock < item.close && incident.closure !== item.id);
        const color =
          conflicts.has(item.id) || (layer === 'access' && !isOpen) ? '#d94b39' : '#087e6b';
        return (
          <g key={item.id}>
            {layer === 'access' && item.open > 0 && (
              <circle
                cx={item.x}
                cy={item.y}
                r="60"
                fill={isOpen ? '#087c67' : '#d94b39'}
                opacity=".09"
                pointerEvents="none"
              />
            )}
            <g
              className={hero ? undefined : 'map-target'}
              role={hero ? undefined : 'button'}
              tabIndex={hero ? undefined : 0}
              aria-label={`${item.name}, ${item.kind}`}
              onClick={hero ? undefined : () => select({ kind: 'place', id: item.id })}
              onKeyDown={
                hero
                  ? undefined
                  : (event) => {
                      if (event.key === 'Enter' || event.key === ' ')
                        select({ kind: 'place', id: item.id });
                    }
              }
            >
              <circle
                cx={item.x}
                cy={item.y}
                r={active ? 17 : 12}
                fill="#fff"
                stroke={color}
                strokeWidth={active ? 3 : 1.5}
              />
              <circle cx={item.x} cy={item.y} r={active ? 7 : 4} fill={color} />
              <g transform={`translate(${item.x},${item.y + 22})`} filter="url(#mapshadow)">
                <rect x="-57" y="-1" width="114" height="32" rx="6" fill="#fffdf7" />
                <text y="12" textAnchor="middle" fontSize="11" fontWeight="750" fill="#182a25">
                  {item.name}
                </text>
                <text y="24" textAnchor="middle" fontSize="9" fill="#52675d">
                  {layer === 'access' && item.open > 0
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
    const a = place(city, step.path.nodes[index]),
      b = place(city, step.path.nodes[index + 1]);
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
    <g pointerEvents="none" className={'citizen'}>
      {layer === 'people' &&
        residents.map((resident, index) => {
          const location = citizenPosition(city, resident, clock, incident);
          return location && <circle key={index} cx={location.x + ((index % 5) - 2) * 4} cy={location.y + ((index % 7) - 3) * 3} r="4.5" fill={['#087e6b', '#7951ae', '#e07b4f'][index % 3]} stroke="#263e38" strokeWidth=".8" />;
        })}
      {point && <circle cx={point.x} cy={point.y} r="9" fill="#1a3430" stroke="#fff" strokeWidth="3" />}
    </g>
  );
}

function LocationStatus({ place, incident }: { place: Place; incident: Incident }) {
  const clock = usePlaybackClock((state) => state.time);
  const open = clock >= place.open && clock < place.close && incident.closure !== place.id;
  return <>{open ? 'Open now' : 'Closed now'}</>;
}

export function CityMap({
  result,
  incident = calm,
  onSelectEdge,
  hero = false,
  cityData = defaultCity,
  residentResults = [],
}: {
  result: Result;
  incident?: Incident;
  onSelectEdge?: (id: string) => void;
  hero?: boolean;
  cityData?: City;
  residentResults?: Result[];
}) {
  const city = cityData;
  const [selected, setSelected] = useState<Selection>(null);
  const [layer, setLayer] = useState<Layer>(cityData === defaultCity ? 'routes' : 'people');
  const selectedEdge =
    selected?.kind === 'edge' ? city.edges.find((edge) => edge.id === selected.id) : undefined;
  const selectedPlace =
    selected?.kind === 'place' ? city.places.find((item) => item.id === selected.id) : undefined;
  return (
    <section
      className={hero ? 'hero-map-container' : 'panel map-panel'}
      aria-label="Achrona city map"
    >
      {!hero && (
        <div className={'panel-heading'}>
          <div>
            <div className="kicker">ACHRONA / SYNTHETIC DISTRICT</div>
            <h2>{cityData === defaultCity ? 'Your route in the city' : 'City activity'}</h2>
          </div>
          <div className={'segmented'} aria-label="Map layer">
            {(['routes', 'access', 'people'] as const).map((value) => (
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
        </div>
      )}
      <div className="map-wrap"><svg
        viewBox="0 0 930 545"
        role={hero ? 'img' : 'group'}
        aria-label="Illustrated Achrona city with districts, river, services and transport"
        className={hero ? 'city-map hero-map' : 'city-map'}
      >
        <defs>
          <pattern id="papergrid" width="35" height="35" patternUnits="userSpaceOnUse">
            <path d="M35 0H0V35" fill="none" stroke="#a8b5a8" strokeWidth=".6" opacity=".35" />
          </pattern>
          <filter id="mapshadow">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity=".15" />
          </filter>
        </defs>
        <CityGround />
        <TransportLayer
          city={city}
          result={result}
          incident={incident}
          select={setSelected}
          hero={hero}
        />
        <LocationLayer
          city={city}
          result={result}
          incident={incident}
          layer={layer}
          select={setSelected}
          hero={hero}
        />
        {!hero && <CitizenLayer city={city} result={result} incident={incident} layer={layer} residents={residentResults} />}
        <g transform="translate(892,25)">
          <path d="M0 24 8 0 16 24 8 18z" fill="#52675d" />
          <text x="8" y="37" fontSize="9" textAnchor="middle" fill="#52675d">
            N
          </text>
        </g>
      </svg>
      {!hero && (
        <>
          <div className="map-caption"><i/>{cityData === defaultCity ? 'Selected journey' : 'City network · purple = added shuttle'}<i className="red-dot"/>Disruption
          </div>
        </>
      )}
      </div>
      {!hero && (<>
          <div className={'map-inspector'} aria-live="polite">
            {selectedEdge ? (
              <>
                <strong>
                  {place(city, selectedEdge.a).name} → {place(city, selectedEdge.b).name}
                </strong>
                <span>
                  {selectedEdge.mode} · {selectedEdge.minutes} min normal travel
                  {incident.edge === selectedEdge.id && incident.delay > 0
                    ? ` · +${incident.delay} min during incident`
                    : ''}
                </span>
                {onSelectEdge && (
                  <button className="btn small" type="button" onClick={() => onSelectEdge(selectedEdge.id)}>
                    Disrupt this link
                  </button>
                )}
              </>
            ) : selectedPlace ? (
              <>
                <strong>{selectedPlace.name}</strong>
                <span>
                  {selectedPlace.kind} ·{' '}
                  {selectedPlace.open
                    ? `${time(selectedPlace.open)}–${time(selectedPlace.close)}`
                    : 'Always accessible'}{' '}
                  ·{' '}
                  <LocationStatus place={selectedPlace} incident={incident} />
                </span>
              </>
            ) : (
              <span>
                Click a location or connection to inspect it. Playback does not change your selection.
              </span>
            )}
          </div>
        </>
      )}
    </section>
  );
}

