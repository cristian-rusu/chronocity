import type { Result } from './public-api';
import { minutesToTime } from '../citizen-planning/public-api';
import styles from './Journey.module.css';

export function Journey({ result }: { result: Result }) {
  if (!result.steps.length) return <p>No activities yet. Add an obligation in My day.</p>;
  return (
    <ol className={styles.list}>
      {result.steps.map((step) => (
        <li key={step.activity.id} className={styles.step}>
          <div>
            <strong>{step.activity.title}</strong>
            <span>
              {minutesToTime(step.arrive)} arrival · {minutesToTime(step.finish)} finish
            </span>
          </div>
          <span className={step.valid && !step.projected ? styles.good : styles.bad}>
            {step.projected ? 'Projected' : step.valid ? 'Feasible' : 'Conflict'}
          </span>
          {step.reason && <p>{step.reason}</p>}
        </li>
      ))}
      {result.omitted.map((activity) => (
        <li key={activity.id} className={styles.step}>
          <strong>{activity.title}</strong>
          <span className={styles.bad}>Deferred</span>
        </li>
      ))}
    </ol>
  );
}
