import { city } from '../../city-network/public-api';
import { minutesToTime, timeToMinutes } from '../../citizen-planning/public-contracts';
import type { Incident } from '../public-contracts';
import { OriginalIcon } from '../../../shared/ui/OriginalIcon';

export function DisruptionPanel({
  incident,
  onChange: update,
}: {
  incident: Incident;
  onChange: (incident: Incident) => void;
}) {
  return (
    <section className="panel incident-panel">
      <div className="panel-heading">
        <div>
          <div className="kicker coral">AFTERSHOCK / EVENT</div>
          <h2>Introduce a disruption</h2>
        </div>
        <span className="event-icon">
          <OriginalIcon name="pulse" />
        </span>
      </div>
      <div className={'panel-body'}>
        <label>
          Transport connection
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
        <div className="field-label">Additional delay</div>
        <div className={'delay-options'} aria-label="Delay presets">
          {[0, 15, 30, 60].map((minutes) => (
            <button
              type="button"
              key={minutes}
              data-value={minutes}
              aria-pressed={incident.delay === minutes}
              onClick={() => update({ ...incident, delay: minutes })}
            >
              {minutes ? `+${minutes}m` : 'None'}
            </button>
          ))}
        </div>
        <div className="field-pair">
          <label>
            Incident starts
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
            Incident ends
            <input
              type="time"
              value={minutesToTime(incident.end)}
              onChange={(event) => {
                const value = timeToMinutes(event.target.value);
                if (value > incident.start) update({ ...incident, end: value });
              }}
            />
          </label>
        </div>
        <label>
          Service closure
          <select
            value={incident.closure}
            onChange={(event) => update({ ...incident, closure: event.target.value })}
          >
            <option value="">No service closure</option>
            {city.places
              .filter((place) => place.open > 0)
              .map((place) => (
                <option key={place.id} value={place.id}>
                  {place.name}
                </option>
              ))}
          </select>
        </label>
        <p className="fine">
          Delay affects entries into the selected connection during the event window; a closure
          lasts the modeled day.
        </p>
        <button
          type="button"
          className="btn secondary"
          onClick={() => update({ ...incident, delay: 0, closure: '' })}
        >
          <OriginalIcon name="reset" /> Clear disruption
        </button>
      </div>
    </section>
  );
}
