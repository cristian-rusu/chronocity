import { city } from '../../city-network/public-api';
import { minutesToTime, timeToMinutes } from '../../citizen-planning/public-contracts';
import type { Incident } from '../public-contracts';
import styles from './DisruptionPanel.module.css';

export function DisruptionPanel({
  incident,
  onChange: update,
}: {
  incident: Incident;
  onChange: (incident: Incident) => void;
}) {
  return (
    <section className={styles.card}>
      <span className={styles.kicker}>AFTERSHOCK / EVENT</span>
      <h2>Introduce a disruption</h2>
      <div className={styles.fields}>
        <label>
          Connection
          <select
            value={incident.edge}
            onChange={(event) => update({ ...incident, edge: event.target.value })}
          >
            {city.edges.map((edge) => (
              <option key={edge.id} value={edge.id}>
                {city.places.find((place) => place.id === edge.a)?.name} →{' '}
                {city.places.find((place) => place.id === edge.b)?.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Delay (minutes)
          <input
            type="number"
            min="0"
            max="180"
            value={incident.delay}
            onChange={(event) =>
              update({ ...incident, delay: Math.min(180, Math.max(0, Number(event.target.value))) })
            }
          />
        </label>
        <div className={styles.presets} aria-label="Delay presets">
          {[0, 15, 30, 60].map((minutes) => (
            <button
              type="button"
              key={minutes}
              aria-pressed={incident.delay === minutes}
              onClick={() => update({ ...incident, delay: minutes })}
            >
              {minutes ? `+${minutes}m` : 'None'}
            </button>
          ))}
        </div>
        <label>
          Starts
          <input
            type="time"
            value={minutesToTime(incident.start)}
            onChange={(event) => {
              const value = timeToMinutes(event.target.value);
              if (value < incident.end) update({ ...incident, start: value });
            }}
          />
        </label>
        <label>
          Ends
          <input
            type="time"
            value={minutesToTime(incident.end)}
            onChange={(event) => {
              const value = timeToMinutes(event.target.value);
              if (value > incident.start) update({ ...incident, end: value });
            }}
          />
        </label>
        <label>
          Service closure
          <select
            value={incident.closure}
            onChange={(event) => update({ ...incident, closure: event.target.value })}
          >
            <option value="">None</option>
            {city.places.map((place) => (
              <option key={place.id} value={place.id}>
                {place.name}
              </option>
            ))}
          </select>
        </label>
        <p className={styles.hint}>
          The delay affects entry to this connection during the event window. A closure lasts the
          modeled day.
        </p>
        <button type="button" onClick={() => update({ ...incident, delay: 0, closure: '' })}>
          Clear disruption
        </button>
      </div>
    </section>
  );
}
