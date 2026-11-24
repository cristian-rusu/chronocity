import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useJourney } from '../app/model';
import { useScenario } from '../modules/scenario-management/public-api';
import { Journey } from '../modules/temporal-simulation/public-api';
import { CityMap } from '../modules/city-network/public-api';
import styles from './Page.module.css';

export function ResyncPage() {
  const { plan, base, disrupted, candidates } = useJourney();
  const [index, setIndex] = useState(0);
  const accept = useScenario((state) => state.accept);
  const chosen = candidates[index] ?? candidates[0];
  return (
    <>
      <section className={styles.intro}>
        <span className={styles.kicker}>03 / Re-Sync</span>
        <h1>Find a way forward.</h1>
        <p>
          Alternatives are ranked by essential obligations, total completion, finish time, and
          travel time. Deferred visits remain visible.
        </p>
      </section>
      {chosen ? (
        <>
          <div className={styles.grid}>
            <section className={styles.card}>
              <h2>Recovery alternatives</h2>
              <div className={styles.fields}>
                <label>
                  Candidate
                  <select
                    aria-label="Recovery candidate"
                    value={Math.min(index, candidates.length - 1)}
                    onChange={(event) => setIndex(Number(event.target.value))}
                  >
                    {candidates.map((candidate, at) => (
                      <option
                        key={`${candidate.order.join('-')}-${candidate.steps.map((step) => step.path?.edges.join('-')).join('|')}`}
                        value={at}
                      >
                        {at + 1}. {candidate.label} · {candidate.completed}/{plan.activities.length}{' '}
                        completed
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p>
                <strong>{chosen.all ? 'Fully feasible' : 'Partial recovery'}</strong> ·{' '}
                {chosen.travel} travel minutes · {chosen.wait} waiting minutes
              </p>
              <p>
                {chosen.omitted.length
                  ? `${chosen.omitted.length} deferred obligation(s)`
                  : 'All obligations preserved.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (
                    chosen.all ||
                    window.confirm(
                      'Accept this partial plan? Deferred obligations will remain visible.',
                    )
                  )
                    accept(chosen.order);
                }}
              >
                Accept this plan
              </button>
              <p>
                <Link to="/my-day/accepted">View accepted itinerary</Link>
              </p>
            </section>
            <CityMap result={chosen} />
          </div>
          <div className={styles.grid}>
            <section>
              <h2>Aftershock</h2>
              <Journey result={disrupted} />
            </section>
            <section>
              <h2>Re-Sync</h2>
              <Journey result={chosen} />
            </section>
          </div>
          <p>
            Original: {base.completed} completed · Aftershock: {disrupted.completed} confirmed ·
            Recovery: {chosen.completed} completed.
          </p>
        </>
      ) : (
        <section className={styles.card}>
          <h2>No feasible route found</h2>
          <p>No obligation can currently be completed. Adjust the disruption or your plan.</p>
          <Link to="/aftershock">Edit disruption</Link>
        </section>
      )}
    </>
  );
}
