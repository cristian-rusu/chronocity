import { Link } from 'react-router-dom';
import { useScenario } from '../contexts/scenario-management/public-api';
import { useJourney } from '../app/model';
import { Journey, Timeline } from '../contexts/temporal-simulation/presentation/public-api';
import { CityMap } from '../contexts/city-network/presentation/public-api';
import { Playback } from '../shared/ui/Playback';
import { DisruptionPanel } from '../contexts/aftershock/presentation/public-api';
import { minutesToTime } from '../contexts/citizen-planning/public-api';
import styles from './Page.module.css';

export function AftershockPage() {
  const { plan, base, disrupted, candidates } = useJourney();
  const incident = useScenario((state) => state.incident);
  const update = useScenario((state) => state.updateIncident);
  const affected = disrupted.steps.filter((step) => !step.valid);
  return (
    <>
      <section className={styles.intro}>
        <span className={styles.kicker}>02 / Aftershock</span>
        <h1>What if the city changes?</h1>
        <p>
          Introduce an interruption, see how your original journey changes, and understand which
          deadlines are at risk.
        </p>
        <Link className={styles.pageAction} to="/resync">
          Find recovery plans →
        </Link>
      </section>
      <div className={styles.metrics}>
        <div>
          <span>Original plan</span>
          <strong>
            {base.completed}/{plan.activities.length}
          </strong>
          <small>Feasible obligations</small>
        </div>
        <div className={affected.length ? styles.metricAlert : ''}>
          <span>Aftershock</span>
          <strong>
            {disrupted.completed}/{plan.activities.length}
          </strong>
          <small>Confirmed obligations</small>
        </div>
        <div className={affected.length ? styles.metricAlert : ''}>
          <span>Conflicts</span>
          <strong>{affected.length}</strong>
          <small>Service or deadline violations</small>
        </div>
        <div>
          <span>Extra travel</span>
          <strong>{Math.max(0, disrupted.travel - base.travel)}m</strong>
          <small>On the original route</small>
        </div>
      </div>
      <div className={styles.simulationGrid}>
        <div className={styles.stack}>
          <CityMap
            result={disrupted}
            incident={incident}
            onSelectEdge={(edge) => update({ ...incident, edge })}
          />
          <Playback
            start={plan.startTime}
            end={Math.max(plan.startTime + 1, disrupted.finish, base.finish)}
          />
          <section className={styles.card}>
            <span className={styles.kicker}>TEMPORAL X-RAY</span>
            <h2>One disruption. A chain of consequences.</h2>
            <Timeline
              start={plan.startTime}
              rows={[
                { label: 'Original', result: base },
                { label: 'Aftershock', result: disrupted },
                ...(candidates[0] ? [{ label: 'Re-Sync', result: candidates[0] }] : []),
              ]}
            />
            <p className={styles.muted}>
              Aftershock follows your original route. Timing after a blocked visit is hypothetical.
            </p>
          </section>
        </div>
        <aside className={styles.stack}>
          <DisruptionPanel incident={incident} onChange={update} />
          <section className={styles.card}>
            <span className={styles.kicker}>THE RIPPLE EFFECT</span>
            <h2>What breaks?</h2>
            {affected.length ? (
              affected.map((step, index) => (
                <div className={styles.impact} key={step.activity.id}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{step.activity.title}</strong>
                    <p>
                      {step.reason === 'Service closed'
                        ? 'This service is closed, so the visit cannot be completed.'
                        : step.reason.includes('Deadline')
                          ? `You arrive at ${minutesToTime(step.arrive)}, too late for this visit's deadline. ${step.reason}`
                          : step.reason}
                    </p>
                    <small>
                      Projected {minutesToTime(step.start)}–{minutesToTime(step.finish)}
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.success}>
                <strong>No conflicts in this itinerary.</strong>
                <p>
                  Try a +30 minute delay on Central Station → City Hall to see the ripple effect.
                </p>
              </div>
            )}
            <Link className={styles.pageAction} to="/resync">
              Find feasible alternatives →
            </Link>
          </section>
        </aside>
      </div>
      <section className={styles.card}>
        <span className={styles.kicker}>DETAILED ITINERARY</span>
        <h2>Inspect the disrupted journey</h2>
        <Journey result={disrupted} />
      </section>
    </>
  );
}
