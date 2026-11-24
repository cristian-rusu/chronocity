import { Link } from 'react-router-dom';
import { city } from '../modules/city-network/public-api';
import { minutesToTime, timeToMinutes } from '../modules/citizen-planning/public-api';
import { useScenario } from '../modules/scenario-management/public-api';
import { useJourney } from '../app/model';
import { Journey } from '../modules/temporal-simulation/public-api';
import { CityMap } from '../modules/city-network/public-api';
import { Playback } from '../shared/ui/Playback';
import styles from './Page.module.css';

export function AftershockPage() {
  const { plan, base, disrupted } = useJourney();
  const incident = useScenario((state) => state.incident);
  const update = useScenario((state) => state.updateIncident);
  return (
    <>
      <section className={styles.intro}>
        <span className={styles.kicker}>02 / Aftershock</span>
        <h1>What if the city changes?</h1>
        <p>
          Introduce a transport delay or service closure and trace the effects through your day.
        </p>
      </section>
      <div className={styles.grid}>
        <section className={styles.card}>
          <h2>Disruption</h2>
          <div className={styles.fields}>
            <label>
              Connection
              <select
                value={incident.edge}
                onChange={(event) => update({ ...incident, edge: event.target.value })}
              >
                {city.edges.map((edge) => (
                  <option key={edge.id} value={edge.id}>
                    {city.places.find((place) => place.id === edge.a)?.name} →{' '}
                    {city.places.find((place) => place.id === edge.b)?.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Delay (minutes)
              <input
                type="number"
                min="0"
                max="180"
                value={incident.delay}
                onChange={(event) =>
                  update({ ...incident, delay: Math.max(0, Number(event.target.value)) })
                }
              />
            </label>
            <label>
              Starts
              <input
                type="time"
                value={minutesToTime(incident.start)}
                onChange={(event) => {
                  const value = timeToMinutes(event.target.value);
                  if (value < incident.end) update({ ...incident, start: value });
                }}
              />
            </label>
            <label>
              Ends
              <input
                type="time"
                value={minutesToTime(incident.end)}
                onChange={(event) => {
                  const value = timeToMinutes(event.target.value);
                  if (value > incident.start) update({ ...incident, end: value });
                }}
              />
            </label>
            <label>
              Service closure
              <select
                value={incident.closure}
                onChange={(event) => update({ ...incident, closure: event.target.value })}
              >
                <option value="">None</option>
                {city.places.map((place) => (
                  <option key={place.id} value={place.id}>
                    {place.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={() => update({ ...incident, delay: 0, closure: '' })}>
              Clear disruption
            </button>
          </div>
        </section>
        <div>
          <CityMap result={disrupted} onSelectEdge={(edge) => update({ ...incident, edge })} />
          <p className={styles.muted}>
            Select a connection on the map, then use the button to target it.
          </p>
        </div>
      </div>
      <div className={styles.cards}>
        <div className={styles.card}>
          <h2>Original</h2>
          <strong className={styles.stat}>
            {base.completed}/{plan.activities.length}
          </strong>
          <p>Confirmed obligations</p>
        </div>
        <div className={styles.card}>
          <h2>Aftershock</h2>
          <strong className={styles.stat}>
            {disrupted.completed}/{plan.activities.length}
          </strong>
          <p>Confirmed obligations · {disrupted.travel - base.travel} additional travel minutes</p>
        </div>
      </div>
      <Playback
        start={plan.startTime}
        end={Math.max(plan.startTime + 1, disrupted.finish, base.finish)}
      />
      <div className={styles.grid}>
        <section>
          <h2>Original timeline</h2>
          <Journey result={base} />
        </section>
        <section>
          <h2>Disrupted timeline</h2>
          <Journey result={disrupted} />
        </section>
      </div>
      <p>
        <Link to="/resync">Find recovery alternatives</Link>
      </p>
    </>
  );
}
