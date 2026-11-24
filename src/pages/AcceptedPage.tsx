import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useJourney } from '../app/model';
import { useScenario } from '../contexts/scenario-management/public-api';
import { Journey } from '../contexts/temporal-simulation/presentation/public-api';
import { minutesToTime } from '../contexts/citizen-planning/public-api';
import { city } from '../contexts/city-network/public-api';
import styles from './Page.module.css';

function download(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function calendar(
  result: NonNullable<ReturnType<typeof useJourney>['candidates'][number]>,
  date: string,
) {
  const stamp = (minutes: number) => {
    const day = new Date(`${date}T00:00:00Z`);
    day.setUTCMinutes(minutes);
    return day.toISOString().replace(/[-:]/g, '').slice(0, 15);
  };
  const escape = (value: string) => value.replaceAll('\\', '\\\\').replaceAll('\n', '\\n').replaceAll(',', '\\,').replaceAll(';', '\\;');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ChronoCity//Reclaimed itinerary//EN', 'CALSCALE:GREGORIAN'];
  let index = 0;
  const add = (title: string, start: number, end: number, location: string) => {
    if (end <= start) return;
    lines.push('BEGIN:VEVENT', `UID:${date}-${index++}@chronocity.local`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${escape(title)}`, `LOCATION:${escape(location)}`, 'END:VEVENT');
  };
  for (const step of result.steps) {
    const location = city.places.find((place) => place.id === step.activity.place)?.name ?? step.activity.place;
    add(`Travel to ${location}`, step.depart, step.arrive, step.path?.nodes.map((id) => city.places.find((place) => place.id === id)?.name ?? id).join(' → ') ?? '');
    add(step.activity.title, step.start, step.finish, location);
  }
  return [...lines, 'END:VCALENDAR'].join('\r\n') + '\r\n';
}

export function AcceptedPage() {
  const [date, setDate] = useState('');
  const { plan, candidates } = useJourney();
  const acceptedOrder = useScenario((state) => state.acceptedOrder);
  const acceptedRoutes = useScenario((state) => state.acceptedRoutes);
  const accept = useScenario((state) => state.accept);
  const accepted = candidates.find(
    (candidate) =>
      candidate.order.join('|') === acceptedOrder?.join('|') &&
      (!acceptedRoutes ||
        JSON.stringify(candidate.steps.map((step) => step.path?.edges ?? [])) ===
          JSON.stringify(acceptedRoutes)),
  );
  return (
    <>
      <section className={styles.intro}>
        <span className={styles.kicker}>Accepted plan</span>
        <h1>Your recovered itinerary.</h1>
        <p>Accepted plans remain available after refresh until the plan or disruption changes.</p>
      </section>
      {accepted ? (
        <section className={styles.card}>
          <span className={styles.kicker}>SCHEDULE RECLAIMED</span>
          <h2>{accepted.all ? 'Full recovery' : 'Partial recovery'}</h2>
          <p>
            {accepted.completed} of {plan.activities.length} obligations · finish{' '}
            {minutesToTime(accepted.finish)}
          </p>
          <Journey result={accepted} />
          <p className={styles.muted}>Calendar export includes travel and completed visits. Deferred visits stay visible here and are excluded from the calendar.</p>
          <div className={styles.actions}>
            <label>
              Calendar date <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <button
              type="button"
              disabled={!date}
              onClick={() => {
                if (date) download(calendar(accepted, date), 'chronocity-itinerary.ics', 'text/calendar');
              }}
            >
              Export calendar
            </button>
            <button type="button" onClick={() => accept(null)}>
              Undo acceptance
            </button>
          </div>
          <p><Link to="/my-day">Edit my day</Link> · <Link to="/resync">Compare recovery options</Link></p>
        </section>
      ) : (
        <section className={styles.card}>
          <h2>No accepted plan</h2>
          <p>Choose a recovery candidate first.</p>
          <Link to="/resync">View alternatives</Link>
        </section>
      )}
    </>
  );
}
