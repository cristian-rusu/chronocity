import { OriginalIcon } from '../../../shared/ui/OriginalIcon';
import type { Result } from '../public-api';
import { city } from '../../city-network/public-api';
import { minutesToTime } from '../../citizen-planning/public-api';

const name = (id: string) => city.places.find((place) => place.id === id)?.name ?? id;

export function Journey({
  result,
  highlightedPlaceId = null,
  onFocusPlace,
}: {
  result: Result;
  highlightedPlaceId?: string | null;
  onFocusPlace?: (placeId: string | null) => void;
}) {
  if (!result.steps.length)
    return <div className="empty">No activities yet. Add your first obligation in Plan.</div>;
  return (
    <>
      <ol className="journey-list">
        {result.steps.map((step, index) => {
          const isFocused = highlightedPlaceId === step.activity.place;
          const stepContent = (
            <>
              <span className={`step-number ${step.valid ? '' : 'conflict'}`}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="step-body">
                <span className="step-title">
                  <strong>{step.activity.title}</strong>
                  {step.projected && step.valid ? (
                    <span className="status projected-status">Projected feasible</span>
                  ) : (
                    <span className={`status ${step.valid ? 'good' : 'bad'}`}>
                      {step.valid ? <OriginalIcon name="check" /> : <OriginalIcon name="alert" />}
                      {step.valid ? 'Feasible' : 'Conflict'}
                    </span>
                  )}
                </span>
                <span className="step-meta">
                  {name(step.activity.place)} · {minutesToTime(step.arrive)} arrival ·{' '}
                  {minutesToTime(step.start)}–{minutesToTime(step.finish)}
                </span>
                <span className="step-meta">
                  {step.path
                    ? `${step.path.minutes} min travel · ${step.path.nodes.map(name).join(' → ')}`
                    : 'No connected route'}
                  {step.wait ? ` · ${step.wait} min waiting` : ''}
                </span>
                {step.reason && <span className="reason">{step.reason}</span>}
                {step.projected && (
                  <span className="fine">Hypothetical timing after an earlier conflict.</span>
                )}
              </span>
            </>
          );

          return (
            <li
              key={step.activity.id}
              className={onFocusPlace ? 'journey-step-item' : undefined}
            >
              {onFocusPlace ? (
                <button
                  type="button"
                  className={`journey-step-btn ${isFocused ? 'journey-step-focused' : ''}`}
                  aria-pressed={isFocused}
                  onClick={() => onFocusPlace(isFocused ? null : step.activity.place)}
                  onMouseEnter={() => onFocusPlace(step.activity.place)}
                  onMouseLeave={() => onFocusPlace(null)}
                  onFocus={() => onFocusPlace(step.activity.place)}
                  onBlur={() => onFocusPlace(null)}
                >
                  {stepContent}
                </button>
              ) : (
                stepContent
              )}
            </li>
          );
        })}
      </ol>
      {result.omitted.length > 0 && (
        <div className="deferred">
          <strong>Not recovered — {result.omitted.length}</strong>
          {result.omitted.map((activity) => (
            <div key={activity.id}>
              {activity.title} · {activity.priority} · due {minutesToTime(activity.deadline)}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
