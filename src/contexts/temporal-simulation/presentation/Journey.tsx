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
          const interactive = Boolean(onFocusPlace);
          return (
            <li
              key={step.activity.id}
              className={
                interactive
                  ? `journey-step-interactive ${isFocused ? 'journey-step-focused' : ''}`
                  : undefined
              }
              tabIndex={interactive ? 0 : undefined}
              onClick={
                interactive
                  ? () => onFocusPlace?.(isFocused ? null : step.activity.place)
                  : undefined
              }
              onMouseEnter={interactive ? () => onFocusPlace?.(step.activity.place) : undefined}
              onMouseLeave={interactive ? () => onFocusPlace?.(null) : undefined}
              onFocus={interactive ? () => onFocusPlace?.(step.activity.place) : undefined}
              onBlur={interactive ? () => onFocusPlace?.(null) : undefined}
              onKeyDown={
                interactive
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onFocusPlace?.(isFocused ? null : step.activity.place);
                      }
                    }
                  : undefined
              }
            >
              <div className={`step-number ${step.valid ? '' : 'conflict'}`}>
                {String(index + 1).padStart(2, '0')}
              </div>
              <div className="step-body">
                <div className="step-title">
                  <strong>{step.activity.title}</strong>
                  {step.projected && step.valid ? (
                    <span className="status projected-status">Projected feasible</span>
                  ) : (
                    <span className={`status ${step.valid ? 'good' : 'bad'}`}>
                      {step.valid ? <OriginalIcon name="check" /> : <OriginalIcon name="alert" />}
                      {step.valid ? 'Feasible' : 'Conflict'}
                    </span>
                  )}
                </div>
                <div className="step-meta">
                  {name(step.activity.place)} · {minutesToTime(step.arrive)} arrival ·{' '}
                  {minutesToTime(step.start)}–{minutesToTime(step.finish)}
                </div>
                <div className="step-meta">
                  {step.path
                    ? `${step.path.minutes} min travel · ${step.path.nodes.map(name).join(' → ')}`
                    : 'No connected route'}
                  {step.wait ? ` · ${step.wait} min waiting` : ''}
                </div>
                {step.reason && <p className="reason">{step.reason}</p>}
                {step.projected && (
                  <p className="fine">Hypothetical timing after an earlier conflict.</p>
                )}
              </div>
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
