import { useRef, useState, type FormEvent } from 'react';
import { OriginalIcon } from '../../shared/ui/OriginalIcon';
import { city } from '../../contexts/city-network/public-api';
import {
  minutesToTime,
  timeToMinutes,
  type Activity,
  type Plan,
} from '../../contexts/citizen-planning/public-api';
import type { Result } from '../../contexts/temporal-simulation/public-api';
import { ActivityEditorDialog } from './ActivityEditorDialog';
import { placeName } from './explanations';
import styles from '../MyJourneyPage.module.css';

const blankActivity = (start: number): Activity => ({
  id: crypto.randomUUID(),
  title: '',
  place: 'hall',
  duration: 15,
  earliest: start,
  deadline: 1020,
  deadlineType: 'finish',
  priority: 'essential',
  fixedOrder: false,
});

export function PlanStepPanel({
  profileName,
  plan,
  base,
  hasAccepted,
  highlightedPlaceId,
  onFocusPlace,
  onUpdatePlan,
  onSaveActivity,
  onRemoveActivity,
  onMoveActivity,
  onSimulateDisruption,
  onViewAccepted,
}: {
  profileName: string;
  plan: Plan;
  base: Result;
  hasAccepted: boolean;
  highlightedPlaceId: string | null;
  onFocusPlace: (placeId: string | null) => void;
  onUpdatePlan: (plan: Plan) => void;
  onSaveActivity: (activity: Activity) => string;
  onRemoveActivity: (id: string) => void;
  onMoveActivity: (id: string, delta: number) => void;
  onSimulateDisruption: () => void;
  onViewAccepted: () => void;
}) {
  const [draft, setDraft] = useState<Activity | null>(null);
  const [error, setError] = useState('');
  const [editingStart, setEditingStart] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);

  const openEditor = (activity: Activity) => {
    returnFocus.current = document.activeElement as HTMLElement;
    setError('');
    setDraft(activity);
  };

  const closeEditor = () => {
    setDraft(null);
    returnFocus.current?.focus();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const message = onSaveActivity(draft);
    setError(message);
    if (!message) closeEditor();
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <div className="kicker">STEP 1 · YOUR NORMAL DAY</div>
          <h2>{profileName}’s daily obligations</h2>
        </div>
        <span className={`tag ${base.all ? 'green' : 'red'}`}>
          {base.completed}/{plan.activities.length} feasible
        </span>
      </div>

      <div className="panel-body">
        <div className={styles.startSummary}>
          <div>
            <strong>Starts at {placeName(plan.startPlace)}</strong>{' '}
            <span>
              · {minutesToTime(plan.startTime)} departure
              {base.steps.length > 0 ? ` · finishes ${minutesToTime(base.finish)}` : ''}
            </span>
          </div>
          <button
            type="button"
            className="btn small"
            aria-expanded={editingStart}
            onClick={() => setEditingStart((open) => !open)}
          >
            {editingStart ? 'Done' : 'Edit start'}
          </button>
        </div>

        {editingStart && (
          <div className={styles.disclosurePanel}>
            <div className="field-pair">
              <label>
                Starting location
                <select
                  value={plan.startPlace}
                  onChange={(event) => onUpdatePlan({ ...plan, startPlace: event.target.value })}
                >
                  {city.places.map((place) => (
                    <option key={place.id} value={place.id}>
                      {place.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Departure time
                <input
                  type="time"
                  value={minutesToTime(plan.startTime)}
                  onChange={(event) => {
                    const time = timeToMinutes(event.target.value);
                    if (Number.isFinite(time)) onUpdatePlan({ ...plan, startTime: time });
                  }}
                />
              </label>
            </div>
          </div>
        )}

        <p className={styles.mapFocusHint}>
          Hover or click any obligation to spotlight its stop and route on the map.
        </p>

        <div className="activity-list">
          {plan.activities.length > 0 ? (
            plan.activities.map((activity, index) => {
              const step = base.steps.find((item) => item.activity.id === activity.id);
              const isFocused = highlightedPlaceId === activity.place;
              return (
                <div
                  key={activity.id}
                  className={`activity ${isFocused ? styles.interactiveActivitySelected : ''}`}
                >
                  <button
                    type="button"
                    className={styles.activitySelectBtn}
                    aria-pressed={isFocused}
                    onMouseEnter={() => onFocusPlace(activity.place)}
                    onMouseLeave={() => onFocusPlace(null)}
                    onFocus={() => onFocusPlace(activity.place)}
                    onBlur={() => onFocusPlace(null)}
                    onClick={() => onFocusPlace(isFocused ? null : activity.place)}
                  >
                    <span className={`step-number ${step && !step.valid ? 'conflict' : ''}`}>
                      {index + 1}
                    </span>
                    <span className="activity-body">
                      <strong>{activity.title}</strong>
                      <small>
                        {placeName(activity.place)} · {activity.duration} min ·{' '}
                        {activity.deadlineType === 'arrival' ? 'arrive' : 'finish'} by{' '}
                        {minutesToTime(activity.deadline)}
                      </small>
                      {step && (
                        <span className={styles.activityMetaLine}>
                          <span className={step.valid ? styles.feasibleChip : styles.conflictChip}>
                            {minutesToTime(step.start)}–{minutesToTime(step.finish)}
                          </span>
                          {step.path && <span>{step.path.minutes}m travel</span>}
                          {step.reason && <span className={styles.conflictChip}>{step.reason}</span>}
                        </span>
                      )}
                      <span className="activity-tags">
                        <span
                          className={`tag ${activity.priority === 'essential' ? 'essential' : ''}`}
                        >
                          {activity.priority}
                        </span>
                        {activity.fixedOrder && <span className="tag">Order locked</span>}
                        {activity.earliest > 0 && (
                          <span className="tag">After {minutesToTime(activity.earliest)}</span>
                        )}
                      </span>
                    </span>
                  </button>
                  <div className="activity-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Move ${activity.title} up`}
                      disabled={index === 0}
                      onClick={() => onMoveActivity(activity.id, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Move ${activity.title} down`}
                      disabled={index === plan.activities.length - 1}
                      onClick={() => onMoveActivity(activity.id, 1)}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Edit ${activity.title}`}
                      onClick={() => openEditor({ ...activity })}
                    >
                      <OriginalIcon name="edit" />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Delete ${activity.title}`}
                      onClick={() => onRemoveActivity(activity.id)}
                    >
                      <OriginalIcon name="trash" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty">Your plan is empty. Add an obligation to begin.</div>
          )}
        </div>

        <div className={styles.stepFoot}>
          <div className={styles.secondaryNavRow}>
            <button
              type="button"
              className="btn secondary"
              disabled={plan.activities.length >= 6}
              onClick={() => openEditor(blankActivity(plan.startTime))}
            >
              <OriginalIcon name="plus" /> Add obligation
            </button>
            {hasAccepted && (
              <button type="button" className={styles.linkBtn} onClick={onViewAccepted}>
                View reclaimed schedule <OriginalIcon name="arrow" />
              </button>
            )}
          </div>

          <div className={`callout ${base.all ? 'success' : 'warning'}`}>
            <strong>
              {base.all
                ? 'Everything fits in normal conditions.'
                : 'Your baseline plan already has a conflict.'}
            </strong>
            <p>
              {base.all
                ? 'Next, see how an unexpected transport delay cascades across these deadlines.'
                : 'Adjust an activity above, or continue to see how disruptions and recovery affect it.'}
            </p>
          </div>

          <button
            type="button"
            className="btn primary full"
            disabled={plan.activities.length === 0}
            onClick={onSimulateDisruption}
          >
            Simulate a disruption <OriginalIcon name="arrow" />
          </button>
        </div>
      </div>

      <ActivityEditorDialog
        draft={draft}
        isExisting={draft ? plan.activities.some((item) => item.id === draft.id) : false}
        error={error}
        onChange={setDraft}
        onSubmit={handleSubmit}
        onClose={closeEditor}
      />
    </section>
  );
}
