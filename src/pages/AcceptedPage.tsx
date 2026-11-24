import { Link } from 'react-router-dom';
import { useJourney } from '../app/model';
import { useScenario } from '../modules/scenario-management/public-api';
import { Journey } from '../modules/temporal-simulation/public-api';
import { minutesToTime } from '../modules/citizen-planning/public-api';
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
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ChronoCity//EN'];
  result.steps.forEach((step, index) => {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${date}-${index}@chronocity.local`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${stamp(step.start)}`,
      `DTEND:${stamp(step.finish)}`,
      `SUMMARY:${step.activity.title.replace(/[\n,;]/g, ' ')}`,
      'END:VEVENT',
    );
  });
  return [...lines, 'END:VCALENDAR'].join('\r\n');
}

export function AcceptedPage() {
  const { plan, candidates } = useJourney();
  const acceptedOrder = useScenario((state) => state.acceptedOrder);
  const accept = useScenario((state) => state.accept);
  const accepted = candidates.find(
    (candidate) => candidate.order.join('|') === acceptedOrder?.join('|'),
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
          <h2>{accepted.all ? 'Full recovery' : 'Partial recovery'}</h2>
          <p>
            {accepted.completed} of {plan.activities.length} obligations · finish{' '}
            {minutesToTime(accepted.finish)}
          </p>
          <Journey result={accepted} />
          <div className={styles.actions}>
            <label>
              Calendar date <input type="date" id="calendar-date" />
            </label>
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById('calendar-date');
                if (input instanceof HTMLInputElement && input.value)
                  download(
                    calendar(accepted, input.value),
                    'chronocity-itinerary.ics',
                    'text/calendar',
                  );
              }}
            >
              Export calendar
            </button>
            <button type="button" onClick={() => accept(null)}>
              Undo acceptance
            </button>
          </div>
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
