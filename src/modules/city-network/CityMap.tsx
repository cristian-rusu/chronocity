import { useState } from 'react';
import { city } from './dataset';
import type { Result } from '../temporal-simulation/public-api';
import styles from './CityMap.module.css';

export function CityMap({
  result,
  onSelectEdge,
}: {
  result: Result;
  onSelectEdge?: (id: string) => void;
}) {
  const [selected, setSelected] = useState('');
  const used = new Set(result.steps.flatMap((step) => step.path?.edges ?? []));
  const selectedEdge = city.edges.find((edge) => edge.id === selected);
  const selectedPlace = city.places.find((place) => place.id === selected);
  return (
    <div className={styles.wrapper}>
      <svg
        viewBox="0 0 930 550"
        role="img"
        aria-label="City transport map with selectable locations and connections"
        className={styles.map}
      >
        {city.edges.map((edge) => {
          const a = city.places.find((place) => place.id === edge.a);
          const b = city.places.find((place) => place.id === edge.b);
          if (!a || !b) return null;
          return (
            <line
              key={edge.id}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className={used.has(edge.id) ? styles.used : styles.edge}
            />
          );
        })}
        {city.edges.map((edge) => {
          const a = city.places.find((place) => place.id === edge.a);
          const b = city.places.find((place) => place.id === edge.b);
          if (!a || !b) return null;
          return (
            <circle
              key={edge.id}
              cx={(a.x + b.x) / 2}
              cy={(a.y + b.y) / 2}
              r="12"
              fill="transparent"
              role="button"
              tabIndex={0}
              aria-label={`${a.name} to ${b.name}, ${edge.minutes} minutes`}
              onClick={() => setSelected(edge.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') setSelected(edge.id);
              }}
            />
          );
        })}
        {city.places.map((place) => (
          <g
            key={place.id}
            role="button"
            tabIndex={0}
            aria-label={place.name}
            onClick={() => setSelected(place.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') setSelected(place.id);
            }}
          >
            <circle cx={place.x} cy={place.y} r="12" className={styles.place} />
            <text x={place.x} y={place.y - 20} textAnchor="middle" className={styles.label}>
              {place.name}
            </text>
          </g>
        ))}
      </svg>
      <p aria-live="polite">
        {selectedEdge
          ? `${city.places.find((place) => place.id === selectedEdge.a)?.name} to ${city.places.find((place) => place.id === selectedEdge.b)?.name} · ${selectedEdge.mode} · ${selectedEdge.minutes} minutes`
          : selectedPlace
            ? `${selectedPlace.name} · open ${selectedPlace.open / 60}:00–${selectedPlace.close / 60}:00`
            : 'Select a location or connection to inspect it.'}
      </p>
      {selectedEdge && onSelectEdge && (
        <button type="button" onClick={() => onSelectEdge(selectedEdge.id)}>
          Use this connection for disruption
        </button>
      )}
    </div>
  );
}
