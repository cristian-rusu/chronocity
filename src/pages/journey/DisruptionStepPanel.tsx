import { useId, useState } from 'react';
import { OriginalIcon } from '../../shared/ui/OriginalIcon';
import { city } from '../../contexts/city-network/public-api';
import {
  minutesToTime,
  timeToMinutes,
  type Plan,
} from '../../contexts/citizen-planning/public-api';
import { defaultIncident, type Incident } from '../../contexts/aftershock/public-api';
import type { Result } from '../../contexts/temporal-simulation/public-api';
import { edgeLabel, explainConflict } from './explanations';
import styles from '../MyJourneyPage.module.css';

export function DisruptionStepPanel({
  plan,
  base,
  disrupted,
  incident,
  highlightedPlaceId,
  onFocusPlace,
  onChangeIncident,
  onBackToPlan,
  onFindRecovery,
}: {
  plan: Plan;
  base: Result;
  disrupted: Result;
  incident: Incident;
  highlightedPlaceId: string | null;
  onFocusPlace: (placeId: string | null) => void;
  onChangeIncident: (incident: Incident) => void;
  onBackToPlan: () => void;
  onFindRecovery: () => void;
}) {
  const id = useId();
  const edgeId = `${id}-edge`;
  const startId = `${id}-start`;
  const endId = `${id}-end`;
  const closureId = `${id}-closure`;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const conflicts = disrupted.steps.filter((step) => !step.valid);
  const projectedFollowups = disrupted.steps.filter((step) => step.valid && step.projected);
  const extraTravel = Math.max(0, disrupted.travel - base.travel);

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <div className="kicker coral">STEP 2 · DISRUPTION IMPACT</div>
          <h2>What breaks when transport slips?</h2>
        </div>
        <span className="event-icon">
          <OriginalIcon name="pulse" />
        </span>
      </div>

      <div className="panel-body">
        <label htmlFor={edgeId}>
          Affected transport link
          <select
            id={edgeId}
            value={incident.edge}
            onChange={(event) => onChangeIncident({ ...incident, edge: event.target.value })}
          >
            {city.edges.map((edge) => (
              <option key={edge.id} value={edge.id}>
                {edgeLabel(edge.id)}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="delay-fieldset">
          <legend>Delay on this link</legend>
          <div className="delay-options">
            {[0, 15, 30, 60].map((minutes) => (
              <button
                type="button"
                key={minutes}
                data-value={minutes}
                aria-pressed={incident.delay === minutes}
                onClick={() => onChangeIncident({ ...incident, delay: minutes })}
              >
                {minutes ? `+${minutes}m` : 'None'}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          className={`${styles.disclosureBtn} ${showAdvanced ? styles.disclosureBtnOpen : ''}`}
          aria-expanded={showAdvanced}
          onClick={() => setShowAdvanced((open) => !open)}
        >
          <span>More disruption settings (time window & service closure)</span>
          <OriginalIcon name="chevron" />
        </button>

        {showAdvanced && (
          <div className={styles.disclosurePanel}>
            <div className="field-pair">
              <label htmlFor={startId}>
                Disruption starts
                <input
                  id={startId}
                  type="time"
                  value={minutesToTime(incident.start)}
                  onChange={(event) => {
                    const value = timeToMinutes(event.target.value);
                    if (value < incident.end) onChangeIncident({ ...incident, start: value });
                  }}
                />
              </label>
              <label htmlFor={endId}>
                Disruption ends
                <input
                  id={endId}
                  type="time"
                  value={minutesToTime(incident.end)}
                  onChange={(event) => {
                    const value = timeToMinutes(event.target.value);
                    if (value > incident.start) onChangeIncident({ ...incident, end: value });
                  }}
                />
              </label>
            </div>
            <label htmlFor={closureId}>
              Unexpected service closure
              <select
                id={closureId}
                value={incident.closure}
                onChange={(event) => onChangeIncident({ ...incident, closure: event.target.value })}
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
            <button
              type="button"
              className="btn secondary"
              onClick={() => onChangeIncident({ ...incident, delay: 0, closure: '' })}
            >
              <OriginalIcon name="reset" /> Clear disruption
            </button>
          </div>
        )}

        <div className="divider" />

        <div className={styles.metricPills}>
          <span
            className={`${styles.metricPill} ${conflicts.length ? styles.metricPillAlert : styles.metricPillGood}`}
          >
            {conflicts.length
              ? `${conflicts.length} obligation${conflicts.length > 1 ? 's' : ''} at risk`
              : `${disrupted.completed}/${plan.activities.length} still feasible`}
          </span>
          {extraTravel > 0 && (
            <span className={`${styles.metricPill} ${styles.metricPillAlert}`}>
              +{extraTravel} min delay on original route
            </span>
          )}
        </div>

        {conflicts.length > 0 ? (
          <>
            {conflicts.map((step, index) => {
              const isFocused = highlightedPlaceId === step.activity.place;
              return (
                <button
                  type="button"
                  className={`impact-item ${styles.interactiveImpact} ${isFocused ? styles.interactiveImpactSelected : ''}`}
                  key={step.activity.id}
                  onMouseEnter={() => onFocusPlace(step.activity.place)}
                  onMouseLeave={() => onFocusPlace(null)}
                  onFocus={() => onFocusPlace(step.activity.place)}
                  onBlur={() => onFocusPlace(null)}
                  onClick={() => onFocusPlace(isFocused ? null : step.activity.place)}
                >
                  <span className="impact-no">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{step.activity.title}</strong>
                    <p>{explainConflict(step, incident)}</p>
                    <small>
                      Projected {minutesToTime(step.start)}–{minutesToTime(step.finish)} ·{' '}
                      {step.activity.priority === 'essential' ? 'Essential obligation' : 'Flexible'}
                    </small>
                  </div>
                </button>
              );
            })}
            {projectedFollowups.length > 0 && (
              <div className={styles.cascadeNote}>
                Because an earlier stop breaks, {projectedFollowups.length} later obligation
                {projectedFollowups.length > 1 ? 's are' : ' is'} also pushed back along the rest
                of the afternoon.
              </div>
            )}
          </>
        ) : (
          <div className="callout success">
            <strong>Your original route absorbs this change.</strong>
            <p>
              Try a +30 minute delay on Central Station → City Hall to see how one tram delay
              triggers missed deadlines across the day.
            </p>
            <button
              type="button"
              className="btn secondary"
              onClick={() => onChangeIncident({ ...defaultIncident, delay: 30 })}
            >
              Apply +30m tram delay
            </button>
          </div>
        )}

        <div className={styles.stepFoot}>
          <button type="button" className="btn primary full" onClick={onFindRecovery}>
            Find a better plan <OriginalIcon name="recover" />
          </button>
          <div className={styles.secondaryNavRow}>
            <button type="button" className={styles.linkBtn} onClick={onBackToPlan}>
              <OriginalIcon name="back" /> Back to normal plan
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
