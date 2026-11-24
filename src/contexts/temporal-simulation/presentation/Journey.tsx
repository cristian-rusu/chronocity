import type { Result } from '../public-api';
import { city } from '../../city-network/public-api';
import { minutesToTime } from '../../citizen-planning/public-api';
import styles from './Journey.module.css';

const name = (id: string) => city.places.find((place) => place.id === id)?.name ?? id;

export function Journey({ result }: { result: Result }) {
  if (!result.steps.length) return <p>No activities yet. Add an obligation in My day.</p>;
  return <ol className={styles.list}>
    {result.steps.map((step, index) => <li key={step.activity.id} className={styles.step}>
      <span className={step.valid ? styles.number : styles.numberBad}>{String(index + 1).padStart(2, '0')}</span>
      <div className={styles.body}><div className={styles.title}><strong>{step.activity.title}</strong><span className={step.valid && !step.projected ? styles.good : styles.bad}>{step.projected ? 'Projected' : step.valid ? 'Feasible' : 'Conflict'}</span></div>
        <span>{name(step.activity.place)} · {minutesToTime(step.arrive)} arrival · {minutesToTime(step.start)}–{minutesToTime(step.finish)}</span>
        <span>{step.path ? `${step.path.minutes} min travel · ${step.path.nodes.map(name).join(' → ')}` : 'No connected route'}{step.wait ? ` · ${step.wait} min waiting` : ''}</span>
        {step.reason && <p>{step.reason}</p>}{step.projected && <small>Timing after an earlier conflict is hypothetical.</small>}
      </div>
    </li>)}
    {result.omitted.length > 0 && <li className={styles.deferred}><strong>Deferred · {result.omitted.length}</strong>{result.omitted.map((activity) => <span key={activity.id}>{activity.title} · {activity.priority} · due {minutesToTime(activity.deadline)}</span>)}</li>}
  </ol>;
}
