import { useEffect, useRef, useState, type FormEvent } from 'react';
import { OriginalIcon } from '../shared/ui/OriginalIcon';
import { city } from '../contexts/city-network/public-api';
import { CityMap } from '../contexts/city-network/presentation/public-api';
import {
  minutesToTime,
  profiles,
  timeToMinutes,
  type Activity,
} from '../contexts/citizen-planning/public-api';
import { DisruptionPanel } from '../contexts/aftershock/presentation/public-api';
import { Journey, Timeline } from '../contexts/temporal-simulation/presentation/public-api';
import { useScenario } from '../contexts/scenario-management/public-api';
import { useJourney } from '../app/model';
import { Playback } from '../shared/ui/Playback';

const blank = (start: number): Activity => ({
  id: crypto.randomUUID(),
  title: '',
  place: 'hall',
  duration: 15,
  earliest: start,
  deadline: Math.min(1440, Math.max(1020, start + 60)),
  deadlineType: 'finish',
  priority: 'essential',
  fixedOrder: false,
});

const placeName = (id: string) => city.places.find((place) => place.id === id)?.name ?? id;

export function RecoveryPage() {
  const { plan, base, disrupted, candidates } = useJourney();
  const profile = useScenario((state) => state.profile);
  const selectProfile = useScenario((state) => state.selectProfile);
  const updatePlan = useScenario((state) => state.updatePlan);
  const saveActivity = useScenario((state) => state.saveActivity);
  const removeActivity = useScenario((state) => state.removeActivity);
  const moveActivity = useScenario((state) => state.moveActivity);
  const incident = useScenario((state) => state.incident);
  const updateIncident = useScenario((state) => state.updateIncident);
  const accept = useScenario((state) => state.accept);
  const acceptedOrder = useScenario((state) => state.acceptedOrder);
  const acceptedRoutes = useScenario((state) => state.acceptedRoutes);

  const [showPlan, setShowPlan] = useState(false);
  const [draft, setDraft] = useState<Activity | null>(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'base' | 'disrupted' | 'recovered'>('recovered');
  const [index, setIndex] = useState(0);

  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (draft && dialog.current && !dialog.current.open) dialog.current.showModal();
    else if (!draft && dialog.current?.open) dialog.current.close();
  }, [draft]);

  const openEditor = (activity: Activity) => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    setError('');
    setDraft(activity);
  };
  const closeEditor = () => {
    setDraft(null);
    dialog.current?.close();
    returnFocus.current?.focus();
  };
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    const message = saveActivity(draft);
    setError(message);
    if (!message) closeEditor();
  }

  const safeIndex = index < candidates.length ? index : 0;
  const chosen = candidates[safeIndex] ?? candidates[0];
  const active = mode === 'base' ? base : mode === 'recovered' ? (chosen ?? disrupted) : disrupted;
  const affected = disrupted.steps.filter((step) => !step.valid);
  const essential = plan.activities.filter((activity) => activity.priority === 'essential').length;

  const acceptedCandidate = acceptedOrder
    ? candidates.find(
        (candidate) =>
          candidate.order.join('|') === acceptedOrder.join('|') &&
          (!acceptedRoutes ||
            JSON.stringify(candidate.steps.map((step) => step.path?.edges ?? [])) ===
              JSON.stringify(acceptedRoutes)),
      )
    : undefined;
  const matchesAccepted = Boolean(chosen && acceptedCandidate && chosen === acceptedCandidate);

  const tabs = (
    <div className="segmented scenario-tabs" aria-label="Displayed scenario">
      {(
        [
          ['base', 'Original'],
          ['disrupted', 'Aftershock'],
          ['recovered', 'Re-Sync'],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          disabled={value === 'recovered' && !chosen}
          onClick={() => setMode(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="kicker">CHRONOCITY / RECOVERY WORKSPACE</div>
          <h1>Recover your day when transit breaks.</h1>
          <p>
            Pick a commuter schedule, trigger a disruption, see which obligations break, and lock in
            a feasible recovery on one screen.
          </p>
        </div>
        <button
          type="button"
          className="btn secondary"
          aria-expanded={showPlan}
          onClick={() => setShowPlan((current) => !current)}
        >
          <OriginalIcon name="plan" />
          {showPlan ? 'Hide plan editor' : 'Customize plan'}
        </button>
      </div>

      <div className="profile-grid" aria-label="Citizen profiles">
        {profiles.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`profile-card ${profile === item.id ? 'selected' : ''}`}
            aria-pressed={profile === item.id}
            onClick={() => selectProfile(item.id)}
          >
            <span className={`avatar ${item.id}`}>{item.initials}</span>
            <span>
              <strong>{item.name}</strong>
              <small>{item.role}</small>
            </span>
            <span className="profile-check">
              {profile === item.id && <OriginalIcon name="check" />}
            </span>
          </button>
        ))}
      </div>

      {showPlan && (
        <section className="panel plan-editor-panel" aria-label="Plan editor">
          <div className="panel-heading">
            <div>
              <div className="kicker">DAILY OBLIGATIONS</div>
              <h2>{profiles.find((item) => item.id === profile)?.name}’s schedule</h2>
            </div>
            <button
              type="button"
              className="btn secondary"
              disabled={plan.activities.length >= 6}
              onClick={() => openEditor(blank(plan.startTime))}
            >
              <OriginalIcon name="plus" />
              Add activity
            </button>
          </div>
          <div className="panel-body">
            <div className="field-pair">
              <label>
                Starting location
                <select
                  value={plan.startPlace}
                  onChange={(event) => updatePlan({ ...plan, startPlace: event.target.value })}
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
                    if (Number.isFinite(time)) updatePlan({ ...plan, startTime: time });
                  }}
                />
              </label>
            </div>
            <div className="divider" />
            <div className="activity-list">
              {plan.activities.length ? (
                plan.activities.map((activity, at) => (
                  <div key={activity.id} className="activity">
                    <div className="step-number">{at + 1}</div>
                    <div className="activity-body">
                      <strong>{activity.title}</strong>
                      <small>
                        {placeName(activity.place)} · {activity.duration} min ·{' '}
                        {activity.deadlineType} by {minutesToTime(activity.deadline)}
                      </small>
                      <div className="activity-tags">
                        <span
                          className={`tag ${activity.priority === 'essential' ? 'essential' : ''}`}
                        >
                          {activity.priority}
                        </span>
                        {activity.fixedOrder && <span className="tag">Order locked</span>}
                        {activity.earliest > 0 && (
                          <span className="tag">After {minutesToTime(activity.earliest)}</span>
                        )}
                      </div>
                    </div>
                    <div className="activity-actions">
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={`Move ${activity.title} up`}
                        disabled={at === 0}
                        onClick={() => moveActivity(activity.id, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={`Move ${activity.title} down`}
                        disabled={at === plan.activities.length - 1}
                        onClick={() => moveActivity(activity.id, 1)}
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
                        onClick={() => removeActivity(activity.id)}
                      >
                        <OriginalIcon name="trash" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty">Your plan is empty. Add an activity to begin.</div>
              )}
            </div>
            <p className="fine">
              Up to six activities. The engine respects service hours, duration, earliest start,
              deadlines, and locked order.
            </p>
          </div>
        </section>
      )}

      {acceptedCandidate && (
        <div className="accepted-banner">
          <OriginalIcon name="check" />
          <div>
            <strong>Schedule reclaimed.</strong>
            <p>
              Saved route:{' '}
              {acceptedCandidate.steps.map((step) => placeName(step.activity.place)).join(' → ')} ·
              Finish {minutesToTime(acceptedCandidate.finish)}.{' '}
              {acceptedCandidate.omitted.length
                ? `${acceptedCandidate.omitted.length} deferred activities remain visible.`
                : 'All required activities fit.'}
            </p>
          </div>
          <button type="button" className="btn secondary" onClick={() => accept(null)}>
            Undo acceptance
          </button>
        </div>
      )}

      <div className="stat-grid">
        <div className="stat">
          <span>Original plan</span>
          <strong>
            {base.completed}/{plan.activities.length}
          </strong>
          <small>Feasible obligations</small>
        </div>
        <div className={`stat ${affected.length ? 'bad-stat' : ''}`}>
          <span>Aftershock</span>
          <strong>
            {disrupted.completed}/{plan.activities.length}
          </strong>
          <small>{affected.length} conflicts</small>
        </div>
        <div className={`stat ${chosen?.all ? 'good-stat' : ''}`}>
          <span>Selected recovery</span>
          <strong>
            {chosen?.completed ?? 0}/{plan.activities.length}
          </strong>
          <small>
            {chosen?.essential ?? 0}/{essential} essential protected
          </small>
        </div>
        <div className="stat">
          <span>Travel time saved</span>
          <strong>
            {chosen && disrupted.travel - chosen.travel >= 0 ? '+' : ''}
            {chosen ? `${disrupted.travel - chosen.travel}m` : '—'}
          </strong>
          <small>Vs. original disrupted route</small>
        </div>
      </div>

      <div className="two-col simulation-grid">
        <div>
          <CityMap
            result={active}
            incident={mode === 'base' ? undefined : incident}
            onSelectEdge={(edge) => updateIncident({ ...incident, edge })}
          />
          <Playback
            start={plan.startTime}
            end={Math.max(plan.startTime + 1, base.finish, disrupted.finish, chosen?.finish ?? 0)}
          />
          <section className="panel timeline-panel">
            <div className="panel-heading">
              <div>
                <div className="kicker">TEMPORAL X-RAY</div>
                <h2>Compare the timelines</h2>
              </div>
              {tabs}
            </div>
            <div className="panel-body">
              <Timeline
                start={plan.startTime}
                rows={[
                  { label: 'Original', result: base },
                  { label: 'Aftershock', result: disrupted },
                  ...(chosen ? [{ label: 'Re-Sync', result: chosen }] : []),
                ]}
              />
              <p className="fine">
                Aftershock follows the original route. Timing after a blocked visit is hypothetical.
              </p>
            </div>
          </section>
        </div>
        <aside>
          <DisruptionPanel incident={incident} onChange={updateIncident} />
          <section className="panel impact-panel">
            <div className="panel-heading">
              <div>
                <div className="kicker coral">THE RIPPLE EFFECT</div>
                <h2>What breaks?</h2>
              </div>
            </div>
            <div className="panel-body">
              {affected.length ? (
                affected.map((step, at) => (
                  <div className="impact-item" key={step.activity.id}>
                    <span className="impact-no">{String(at + 1).padStart(2, '0')}</span>
                    <div>
                      <strong>{step.activity.title}</strong>
                      <p>
                        {step.reason.includes('Service closed')
                          ? 'This service is closed for the modeled day, so the visit cannot be completed.'
                          : step.reason}
                      </p>
                      <small>
                        Projected {minutesToTime(step.start)}–{minutesToTime(step.finish)}
                      </small>
                    </div>
                  </div>
                ))
              ) : (
                <div className="callout success">
                  <strong>No conflicts in this itinerary.</strong>
                  <p>
                    Try a +30 minute delay on Central Station → City Hall to see the ripple effect.
                  </p>
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>

      <div className="two-col recover-grid recover-section">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <div className="kicker">ALTERNATIVE FUTURES</div>
              <h2>Choose a recovery strategy</h2>
            </div>
            <span className="tag">{candidates.length} options</span>
          </div>
          <div className="panel-body">
            <p className="muted">
              Ranked by essential activities protected, total activities completed, then earliest
              finish and travel time.
            </p>
            <div className="candidate-list">
              {candidates.length ? (
                candidates.map((candidate, at) => (
                  <button
                    type="button"
                    key={`${candidate.order.join('-')}-${candidate.steps.map((step) => step.path?.edges.join(',')).join('|')}`}
                    className={`candidate ${at === safeIndex ? 'selected' : ''}`}
                    aria-pressed={at === safeIndex}
                    onClick={() => {
                      setIndex(at);
                      setMode('recovered');
                    }}
                  >
                    <div>
                      <span className={`tag ${at === 0 ? 'green' : ''}`}>
                        {at === 0 ? 'Recommended' : candidate.label}
                      </span>
                      <strong>
                        {candidate.label === 'Reroute' ? 'Keep activity order' : candidate.label}
                      </strong>
                      <small>
                        {candidate.steps.map((step) => placeName(step.activity.place)).join(' → ')}
                      </small>
                      <small>
                        Finish {minutesToTime(candidate.finish)} · Travel {candidate.travel}m
                        {candidate.omitted.length ? ` · ${candidate.omitted.length} deferred` : ''}
                      </small>
                    </div>
                    <b>
                      {candidate.completed}/{plan.activities.length}
                    </b>
                  </button>
                ))
              ) : (
                <div className="empty">
                  No feasible activity remains. Adjust the disruption or customize your plan. No
                  invalid recovery is offered.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <div className="kicker">YOUR SELECTED FUTURE</div>
              <h2>
                {chosen
                  ? chosen.all
                    ? 'A complete recovery'
                    : 'A partial recovery'
                  : 'No feasible recovery'}
              </h2>
            </div>
            {chosen && (
              <span className={`tag ${chosen.all ? 'green' : 'red'}`}>
                {chosen.all ? 'All constraints met' : 'Some obligations deferred'}
              </span>
            )}
          </div>
          <div className="panel-body">
            {chosen ? (
              <>
                <Journey result={chosen} />
                <div className={`callout ${chosen.all ? 'success' : 'warning'}`}>
                  <strong>
                    {chosen.all
                      ? 'Ready to reclaim your schedule.'
                      : 'Some obligations must be postponed.'}
                  </strong>
                  <p>
                    {chosen.all
                      ? 'Every activity meets its service and personal deadlines.'
                      : 'This option protects the feasible activities listed above; deferred activities remain visible.'}
                  </p>
                </div>
                {matchesAccepted ? (
                  <button type="button" className="btn secondary full" onClick={() => accept(null)}>
                    Undo acceptance
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn primary full"
                    onClick={() => {
                      if (
                        chosen.all ||
                        window.confirm(
                          'Accept this partial recovery? Deferred obligations will remain visible.',
                        )
                      )
                        accept(
                          chosen.order,
                          chosen.steps.map((step) => step.path?.edges ?? []),
                        );
                    }}
                  >
                    {chosen.all ? 'Reclaim schedule' : 'Accept partial recovery'}{' '}
                    <OriginalIcon name="check" />
                  </button>
                )}
              </>
            ) : (
              <p className="muted">Try changing the disruption or reviewing your plan deadlines.</p>
            )}
          </div>
        </section>
      </div>

      <dialog
        ref={dialog}
        id="editor"
        aria-labelledby="editor-title"
        onClose={() => {
          setDraft(null);
          returnFocus.current?.focus();
        }}
      >
        {draft && (
          <form onSubmit={submit}>
            <div className="panel-heading">
              <div>
                <div className="kicker">YOUR DAILY PLAN</div>
                <h2 id="editor-title">
                  {plan.activities.some((item) => item.id === draft.id) ? 'Edit' : 'Add'} obligation
                </h2>
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label="Close editor"
                onClick={closeEditor}
              >
                ×
              </button>
            </div>
            <div className="panel-body">
              <label>
                Activity name
                <input
                  required
                  maxLength={80}
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                />
              </label>
              <label>
                Location
                <select
                  value={draft.place}
                  onChange={(event) => setDraft({ ...draft, place: event.target.value })}
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
                    value={Number.isFinite(draft.duration) ? draft.duration : ''}
                    onChange={(event) =>
                      setDraft({ ...draft, duration: Number(event.target.value) })
                    }
                  />
                </label>
                <label>
                  Earliest start
                  <input
                    type="time"
                    required
                    value={Number.isFinite(draft.earliest) ? minutesToTime(draft.earliest) : ''}
                    onChange={(event) =>
                      setDraft({ ...draft, earliest: timeToMinutes(event.target.value) })
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
                    value={Number.isFinite(draft.deadline) ? minutesToTime(draft.deadline) : ''}
                    onChange={(event) =>
                      setDraft({ ...draft, deadline: timeToMinutes(event.target.value) })
                    }
                  />
                </label>
                <label>
                  Deadline applies to
                  <select
                    value={draft.deadlineType}
                    onChange={(event) =>
                      setDraft({
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
                    setDraft({
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
                  onChange={(event) => setDraft({ ...draft, fixedOrder: event.target.checked })}
                />{' '}
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
    </>
  );
}
