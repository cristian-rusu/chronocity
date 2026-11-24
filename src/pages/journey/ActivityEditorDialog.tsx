import { useEffect, useRef, type FormEvent } from 'react';
import { OriginalIcon } from '../../shared/ui/OriginalIcon';
import { city } from '../../contexts/city-network/public-api';
import {
  minutesToTime,
  timeToMinutes,
  type Activity,
} from '../../contexts/citizen-planning/public-api';

export function ActivityEditorDialog({
  draft,
  isExisting,
  error,
  onChange,
  onSubmit,
  onClose,
}: {
  draft: Activity | null;
  isExisting: boolean;
  error: string;
  onChange: (activity: Activity) => void;
  onSubmit: (event: FormEvent) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (draft && dialog.current && !dialog.current.open) {
      dialog.current.showModal();
    } else if (!draft && dialog.current?.open) {
      dialog.current.close();
    }
  }, [draft]);

  return (
    <dialog ref={dialog} id="editor" aria-labelledby="editor-title" onClose={onClose}>
      {draft && (
        <form onSubmit={onSubmit}>
          <div className="panel-heading">
            <div>
              <div className="kicker">YOUR DAILY PLAN</div>
              <h2 id="editor-title">{isExisting ? 'Edit' : 'Add'} obligation</h2>
            </div>
            <button type="button" className="icon-btn" aria-label="Close editor" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="panel-body">
            <label>
              Activity name
              <input
                autoFocus
                required
                maxLength={80}
                value={draft.title}
                onChange={(event) => onChange({ ...draft, title: event.target.value })}
              />
            </label>
            <label>
              Location
              <select
                value={draft.place}
                onChange={(event) => onChange({ ...draft, place: event.target.value })}
              >
                {city.places.map((place) => (
                  <option key={place.id} value={place.id}>
                    {place.name} · {minutesToTime(place.open)}–{minutesToTime(place.close)}
                  </option>
                ))}
              </select>
            </label>
            <div className="field-pair">
              <label>
                Duration (minutes)
                <input
                  type="number"
                  min="1"
                  max="240"
                  required
                  value={draft.duration}
                  onChange={(event) => onChange({ ...draft, duration: Number(event.target.value) })}
                />
              </label>
              <label>
                Earliest start
                <input
                  type="time"
                  required
                  value={minutesToTime(draft.earliest)}
                  onChange={(event) =>
                    onChange({ ...draft, earliest: timeToMinutes(event.target.value) })
                  }
                />
              </label>
            </div>
            <div className="field-pair">
              <label>
                Deadline
                <input
                  type="time"
                  required
                  value={minutesToTime(draft.deadline)}
                  onChange={(event) =>
                    onChange({ ...draft, deadline: timeToMinutes(event.target.value) })
                  }
                />
              </label>
              <label>
                Deadline applies to
                <select
                  value={draft.deadlineType}
                  onChange={(event) =>
                    onChange({
                      ...draft,
                      deadlineType: event.target.value === 'arrival' ? 'arrival' : 'finish',
                    })
                  }
                >
                  <option value="finish">Completion</option>
                  <option value="arrival">Arrival</option>
                </select>
              </label>
            </div>
            <label>
              Priority
              <select
                value={draft.priority}
                onChange={(event) =>
                  onChange({
                    ...draft,
                    priority: event.target.value === 'essential' ? 'essential' : 'flexible',
                  })
                }
              >
                <option value="essential">Essential</option>
                <option value="flexible">Flexible</option>
              </select>
            </label>
            <label className="check-line">
              <input
                type="checkbox"
                checked={draft.fixedOrder}
                onChange={(event) => onChange({ ...draft, fixedOrder: event.target.checked })}
              />
              Preserve relative order during recovery
            </label>
            {error && (
              <p id="editor-error" role="alert" className="reason">
                {error}
              </p>
            )}
            <button type="submit" className="btn primary full">
              Save obligation <OriginalIcon name="check" />
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
