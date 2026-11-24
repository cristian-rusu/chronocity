import { Link, useNavigate } from 'react-router-dom';
import { useJourney } from '../app/model';
import { useScenario } from '../modules/scenario-management/public-api';
import { defaultIncident } from '../modules/aftershock/public-api';
import { CityMap } from '../modules/city-network/public-api';
import styles from './Page.module.css';

export function HomePage() {
  const { base } = useJourney();
  const updateIncident = useScenario((state) => state.updateIncident);
  const navigate = useNavigate();
  return (
    <>
      <section className={styles.intro}>
        <span className={styles.kicker}>Urban time intelligence</span>
        <h1>Reclaim your day when the city falls out of sync.</h1>
        <p>
          Plan essential visits, see how disruptions cascade, and compare feasible recovery routes
          in a fictional city.
        </p>
        <div className={styles.actions}>
          <Link to="/my-day">Plan my day</Link>
          <button
            type="button"
            onClick={() => {
              updateIncident(defaultIncident);
              navigate('/aftershock');
            }}
          >
            Try a sample disruption
          </button>
        </div>
      </section>
      <div className={styles.grid}>
        <CityMap result={base} />
        <div className={styles.card}>
          <h2>One city, connected decisions</h2>
          <p>
            Start with your obligations. Aftershock traces the impact of a delay. Re-Sync finds
            alternatives. City Lab compares municipal interventions for 60 synthetic residents.
          </p>
          <div className={styles.cards}>
            <Link to="/aftershock">Explore Aftershock</Link>
            <Link to="/resync">See Re-Sync</Link>
            <Link to="/city-lab">Open City Lab</Link>
          </div>
        </div>
      </div>
    </>
  );
}
