import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useJourney } from '../app/model';
import { useScenario } from '../contexts/scenario-management/public-api';
import { Journey, Timeline } from '../contexts/temporal-simulation/presentation/public-api';
import { CityMap } from '../contexts/city-network/presentation/public-api';
import { minutesToTime } from '../contexts/citizen-planning/public-api';
import { city } from '../contexts/city-network/public-api';
import styles from './Page.module.css';

export function ResyncPage() {
  const { plan, base, disrupted, candidates } = useJourney();
  const [index, setIndex] = useState(0);
  const accept = useScenario((state) => state.accept);
  const incident = useScenario((state) => state.incident);
  const acceptedOrder = useScenario((state) => state.acceptedOrder);
  const chosen = candidates[index] ?? candidates[0];
  const name = (id: string) => city.places.find((place) => place.id === id)?.name ?? id;
  return (
    <>
      <section className={styles.intro}>
        <span className={styles.kicker}>03 / Re-Sync</span>
        <h1>Find a way forward.</h1>
        <p>
          Compare feasible alternatives. Essential obligations come first, and missed visits stay
          visible.
        </p>
        <Link className={styles.subtleAction} to="/aftershock">
          ← Back to Aftershock
        </Link>
      </section>
      {acceptedOrder && (
        <div className={styles.success}>
          <strong>Schedule reclaimed.</strong>
          <p>
            Your accepted itinerary is saved.{' '}
            <Link to="/my-day/accepted">View accepted itinerary</Link>
          </p>
        </div>
      )}
      {chosen ? (
        <>
          <div className={styles.metrics}>
            <div>
              <span>Aftershock</span>
              <strong>
                {disrupted.completed}/{plan.activities.length}
              </strong>
              <small>Confirmed obligations</small>
            </div>
            <div>
              <span>Selected recovery</span>
              <strong>
                {chosen.completed}/{plan.activities.length}
              </strong>
              <small>Feasible obligations</small>
            </div>
            <div>
              <span>Essential protected</span>
              <strong>
                {chosen.essential}/
                {plan.activities.filter((activity) => activity.priority === 'essential').length}
              </strong>
              <small>Mandatory priorities</small>
            </div>
            <div>
              <span>Travel difference</span>
              <strong>
                {disrupted.travel - chosen.travel >= 0 ? '+' : ''}
                {disrupted.travel - chosen.travel}m
              </strong>
              <small>Versus disrupted route</small>
            </div>
          </div>
          <div className={styles.grid}>
            <section className={styles.card}>
              <span className={styles.kicker}>ALTERNATIVE FUTURES</span>
              <h2>Choose a recovery strategy</h2>
              <p className={styles.muted}>
                Ranked by essential visits protected, total visits completed, earliest finish, and
                travel time.
              </p>
              <div className={styles.candidates}>
                {candidates.map((candidate, at) => (
                  <button
                    type="button"
                    key={`${candidate.order.join('-')}-${candidate.steps.map((step) => step.path?.edges.join('-')).join('|')}`}
                    className={at === index ? styles.candidateSelected : styles.candidate}
                    aria-pressed={at === index}
                    onClick={() => setIndex(at)}
                  >
                    <span>
                      <small>{at === 0 ? 'RECOMMENDED' : `OPTION ${at + 1}`}</small>
                      <strong>
                        {candidate.label === 'Reroute' ? 'Keep activity order' : candidate.label}
                      </strong>
                      <span>
                        {candidate.steps.map((step) => name(step.activity.place)).join(' → ')}
                      </span>
                      <span>
                        Finish {minutesToTime(candidate.finish)} · Travel {candidate.travel}m ·{' '}
                        {candidate.omitted.length
                          ? `${candidate.omitted.length} deferred`
                          : 'Nothing deferred'}
                      </span>
                    </span>
                    <b>
                      {candidate.completed}/{plan.activities.length}
                    </b>
                  </button>
                ))}
              </div>
            </section>
            <section className={styles.card}>
              <span className={styles.kicker}>YOUR SELECTED FUTURE</span>
              <h2>{chosen.all ? 'A complete recovery' : 'A partial recovery'}</h2>
              <Journey result={chosen} />
              <div className={chosen.all ? styles.success : styles.warning}>
                <strong>
                  {chosen.all
                    ? 'Ready to reclaim your schedule.'
                    : 'Some visits must be postponed.'}
                </strong>
                <p>
                  {chosen.all
                    ? 'Every activity meets its service and personal deadlines.'
                    : 'Deferred activities remain in your original plan and are shown above.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (
                    chosen.all ||
                    window.confirm(
                      'Accept this partial plan? Deferred obligations will remain visible.',
                    )
                  )
                    accept(
                      chosen.order,
                      chosen.steps.map((step) => step.path?.edges ?? []),
                    );
                }}
              >
                Accept this plan
              </button>
              <p>
                <Link to="/my-day/accepted">View accepted itinerary</Link>
              </p>
            </section>
          </div>
          <section className={styles.card}>
            <span className={styles.kicker}>BEFORE / AFTER / RECOVERY</span>
            <h2>Compare the timelines</h2>
            <Timeline
              start={plan.startTime}
              rows={[
                { label: 'Original', result: base },
                { label: 'Aftershock', result: disrupted },
                { label: 'Re-Sync', result: chosen },
              ]}
            />
          </section>
          <CityMap result={chosen} incident={incident} />
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
