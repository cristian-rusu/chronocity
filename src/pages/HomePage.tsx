import { Link, useNavigate } from 'react-router-dom';
import { OriginalIcon } from '../shared/ui/OriginalIcon';
import { useJourney } from '../app/model';
import { useScenario } from '../contexts/scenario-management/public-api';
import { defaultIncident } from '../contexts/aftershock/public-api';
import { CityMap } from '../contexts/city-network/presentation/public-api';
import styles from './HomePage.module.css';

const steps = [
  {
    number: '01',
    icon: 'plan',
    title: 'Plan your day',
    copy: 'Review your daily obligations, opening hours and fixed deadlines on Achrona’s live city map.',
    to: '/my-journey',
  },
  {
    number: '02',
    icon: 'pulse',
    title: 'See the disruption',
    copy: 'Trigger a transport delay and immediately understand which appointments and pickups are now at risk.',
    to: '/my-journey?step=disruption',
  },
  {
    number: '03',
    icon: 'recover',
    title: 'Reclaim your schedule',
    copy: 'Accept a clear, feasible recovery route that protects essential deadlines before you leave.',
    to: '/my-journey?step=recovery',
  },
] as const;

export function HomePage() {
  const { plan, base, candidates } = useJourney();
  const updateIncident = useScenario((state) => state.updateIncident);
  const navigate = useNavigate();
  const heroResult = candidates[0] ?? base;

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="kicker">
            <i className="live-dot" /> HACK THE FUTURE 2026 / ACHRONA
          </span>
          <h1 className={styles.heroTitle}>
            One disruption should not <em>ruin your entire day.</em>
          </h1>
          <p>
            ChronoCity helps working parents, commuters and shift workers recover their daily plans
            when transport delays put essential obligations at risk.
          </p>
          <div className="hero-actions">
            <Link className="btn primary" to="/my-journey">
              Start my journey <OriginalIcon name="arrow" />
            </Link>
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                updateIncident({ ...defaultIncident, delay: 30 });
                navigate('/my-journey?step=disruption');
              }}
            >
              <OriginalIcon name="pulse" /> Explore sample disruption
            </button>
          </div>
          <span className="hero-note">
            <OriginalIcon name="info" /> Built for urban citizens with limited schedule flexibility
            · deterministic simulation in Achrona.
          </span>
        </div>

        <div className="hero-art">
          <CityMap
            result={heroResult}
            incident={defaultIncident}
            startPlaceId={plan.startPlace}
            hero
          />
          <div className="float-card float-top">
            <small className="kicker">DISRUPTION</small>
            <strong>+30 min</strong>
            <span>Tram delay to City Hall</span>
          </div>
          <div className="float-card float-bottom">
            <small className="kicker">RECOVERY</small>
            <strong>
              3/3 deadlines protected <OriginalIcon name="arrow" />
            </strong>
            <span>Alternative route found automatically.</span>
          </div>
        </div>
      </section>

      <section className="home-context">
        <div>
          <span className="kicker">WHY CHRONOCITY</span>
          <h2>
            Connected city.
            <br />
            Disconnected schedules.
          </h2>
        </div>
        <p>
          Public transport, workplaces, childcare and public services run on independent clocks.
          When one link slips, a single delay can trigger missed appointments and closed doors.
          ChronoCity connects transport disruptions directly to your real responsibilities — and
          finds a feasible way forward.
        </p>
      </section>

      <section className={styles.workflowCards} aria-label="How ChronoCity works">
        {steps.map(({ number, icon, title, copy, to }) => (
          <Link key={number} to={to} className="home-card">
            <div className="card-top">
              <span>{number}</span>
              <OriginalIcon name={icon} />
            </div>
            <h3>{title}</h3>
            <p>{copy}</p>
            <span className="card-link">
              Open step <OriginalIcon name="arrow" />
            </span>
          </Link>
        ))}
      </section>

      <aside className={styles.cityLabBanner} aria-label="Broader municipal vision">
        <div>
          <span className="kicker">BROADER VISION · CITY LAB</span>
          <p>
            Beyond individual recovery: see how municipalities can test transit and service-hour
            interventions across 60 synthetic residents.
          </p>
        </div>
        <Link className="btn secondary" to="/city-lab">
          <OriginalIcon name="lab" /> Explore City Lab
        </Link>
      </aside>
    </>
  );
}
