import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { city } from '../contexts/city-network/public-api';
import { profiles } from '../contexts/citizen-planning/public-api';
import {
  minutesToTime,
  timeToMinutes,
  type Activity,
} from '../contexts/citizen-planning/public-api';
import { useScenario } from '../contexts/scenario-management/public-api';
import { useJourney } from '../app/model';
import { Journey } from '../contexts/temporal-simulation/presentation/public-api';
import styles from './Page.module.css';

const blank = (start: number): Activity => ({
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

export function MyDayPage() {
  const { plan, base } = useJourney();
  const profile = useScenario((state) => state.profile);
  const selectProfile = useScenario((state) => state.selectProfile);
  const updatePlan = useScenario((state) => state.updatePlan);
  const saveActivity = useScenario((state) => state.saveActivity);
  const removeActivity = useScenario((state) => state.removeActivity);
  const moveActivity = useScenario((state) => state.moveActivity);
  const [draft, setDraft] = useState<Activity | null>(null);
  const [error, setError] = useState('');
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    const message = saveActivity(draft);
    setError(message);
    if (!message) setDraft(null);
  }
  return (
    <>
      <section className={styles.intro}>
        <span className={styles.kicker}>01 / Your day</span>
        <h1>Start with what matters.</h1>
        <p>
          Tell us where you need to be, when, and which obligations cannot be missed. Each profile
          keeps its own plan.
        </p>
        <Link className={styles.pageAction} to="/aftershock">
          Simulate my journey →
        </Link>
      </section>
      <div className={styles.profiles} aria-label="Citizen profiles">
        {profiles.map((item) => (
          <button
            key={item.id}
            type="button"
            className={profile === item.id ? styles.profileSelected : styles.profile}
            aria-pressed={profile === item.id}
            onClick={() => selectProfile(item.id)}
          >
            <span className={styles.avatar}>{item.initials}</span>
            <span>
              <strong>{item.name}</strong>
              <small>{item.role}</small>
            </span>
            <span aria-hidden="true">{profile === item.id ? '✓' : ''}</span>
          </button>
        ))}
      </div>
      <div className={styles.grid}>
        <section className={styles.card}>
          <span className={styles.kicker}>YOUR INPUTS</span>
          <h2>Daily plan</h2>
          <div className={styles.fields}>
            <label>
              Citizen profile
              <select value={profile} onChange={(event) => selectProfile(event.target.value)}>
                {profiles.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.role}
                  </option>
                ))}
              </select>
            </label>
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
          <p>
            {base.completed} of {plan.activities.length} obligations completed in the baseline.
          </p>
          <button
            type="button"
            onClick={() => {
              setDraft(blank(plan.startTime));
              setError('');
            }}
            disabled={plan.activities.length >= 6}
          >
            Add obligation
          </button>
        </section>
        <section className={styles.card}>
          <span className={styles.kicker}>YOUR OBLIGATIONS</span>
          <h2>Visits to protect</h2>
          {plan.activities.length === 0 && <p>No obligations yet.</p>}
          {plan.activities.map((activity, index) => (
            <article key={activity.id} className={styles.activity}>
              <h3>{activity.title}</h3>
              <p>
                {city.places.find((place) => place.id === activity.place)?.name} ·{' '}
                {activity.duration} minutes · {activity.priority}
              </p>
              <p>
                Deadline {minutesToTime(activity.deadline)} ({activity.deadlineType})
                {activity.fixedOrder ? ' · Fixed order' : ''}
              </p>
              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={() => {
                    setDraft({ ...activity });
                    setError('');
                  }}
                >
                  Edit
                </button>
                <button type="button" onClick={() => removeActivity(activity.id)}>
                  Delete
                </button>
                <button
                  type="button"
                  aria-label={`Move ${activity.title} up`}
                  disabled={index === 0}
                  onClick={() => moveActivity(activity.id, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={`Move ${activity.title} down`}
                  disabled={index === plan.activities.length - 1}
                  onClick={() => moveActivity(activity.id, 1)}
                >
                  ↓
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
      {draft && (
        <div className={styles.modalBackdrop}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="editor-title"
            className={styles.editor}
          >
            <form onSubmit={submit} className={styles.fields}>
              <h2 id="editor-title">
                {plan.activities.some((item) => item.id === draft.id) ? 'Edit' : 'Add'} obligation
              </h2>
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
                      {place.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Duration (minutes)
                <input
                  type="number"
                  min="1"
                  max="240"
                  value={draft.duration}
                  onChange={(event) => setDraft({ ...draft, duration: Number(event.target.value) })}
                />
              </label>
              <label>
                Earliest start
                <input
                  type="time"
                  value={minutesToTime(draft.earliest)}
                  onChange={(event) =>
                    setDraft({ ...draft, earliest: timeToMinutes(event.target.value) })
                  }
                />
              </label>
              <label>
                Deadline
                <input
                  type="time"
                  value={minutesToTime(draft.deadline)}
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
              <label>
                <input
                  type="checkbox"
                  checked={draft.fixedOrder}
                  onChange={(event) => setDraft({ ...draft, fixedOrder: event.target.checked })}
                />{' '}
                Preserve relative order
              </label>
              {error && (
                <p role="alert" className={styles.error}>
                  {error}
                </p>
              )}
              <div className={styles.actions}>
                <button type="submit">Save obligation</button>
                <button type="button" onClick={() => setDraft(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <section className={styles.card}>
        <span className={styles.kicker}>BASELINE CHECK</span>
        <h2>Is your original plan possible?</h2>
        <Journey result={base} />
        <div className={base.all ? styles.success : styles.warning}>
          <strong>
            {base.all
              ? 'Ready for a real-world interruption.'
              : 'Your plan has constraints to resolve.'}
          </strong>
          <p>
            {base.all
              ? 'Every visit fits in the normal city network. Next, see what happens when transport is disrupted.'
              : 'Review the conflicts above or explore recovery alternatives.'}
          </p>
        </div>
        <p>
          <Link to="/aftershock">Continue to Aftershock</Link>
        </p>
      </section>
    </>
  );
}
