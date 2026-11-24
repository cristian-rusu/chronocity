import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Info, Activity, CalendarDays, RefreshCcw, Building2 } from 'lucide-react';
import { useJourney } from '../app/model';
import { useScenario } from '../contexts/scenario-management/public-api';
import { defaultIncident } from '../contexts/aftershock/public-api';
import { CityMap } from '../contexts/city-network/presentation/public-api';
import styles from './HomePage.module.css';

const features = [
  {
    number: '01',
    icon: CalendarDays,
    title: 'Plan around real constraints',
    copy: 'Set your stops, service hours and deadlines. Know whether your day is possible before you leave.',
    to: '/my-day',
  },
  {
    number: '02',
    icon: Activity,
    title: 'See the ripple effect',
    copy: 'Simulate a disruption. Follow the consequences across your journey, beyond one train line.',
    to: '/aftershock',
  },
  {
    number: '03',
    icon: RefreshCcw,
    title: 'Reclaim your day',
    copy: 'Compare new routes and activity orders. Keep essential obligations safe and see what needs postponing.',
    to: '/resync',
  },
  {
    number: '04',
    icon: Building2,
    title: 'Change the system',
    copy: 'Test city interventions against 60 synthetic residents and a limited budget.',
    to: '/city-lab',
  },
];

export function HomePage() {
  const { base } = useJourney();
  const updateIncident = useScenario((state) => state.updateIncident);
  const navigate = useNavigate();
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.copy}>
          <span className={styles.kicker}>
            <i /> HACK THE FUTURE / ACHRONA
          </span>
          <h1>
            The city moves.
            <br />
            <em>Life gets in the way.</em>
          </h1>
          <p>
            One delayed tram can ruin an entire afternoon. ChronoCity shows what happens next — and
            finds a way to get your day back.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primary} to="/my-day">
              Plan my day <ArrowUpRight aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => {
                updateIncident(defaultIncident);
                navigate('/aftershock');
              }}
            >
              Try a disruption <Activity aria-hidden="true" />
            </button>
          </div>
          <span className={styles.note}>
            <Info size="18" aria-hidden="true" /> An interactive prototype with a fictional city and
            calculated scenarios.
          </span>
        </div>
        <div className={styles.art}>
          <CityMap result={base} incident={defaultIncident} hero />
          <div className={`${styles.float} ${styles.floatTop}`}>
            <small>AFTERSHOCK</small>
            <strong>+30 min</strong>
            <span>Tram interruption</span>
          </div>
          <div className={`${styles.float} ${styles.floatBottom}`}>
            <small>A BETTER FUTURE</small>
            <strong>
              Find another way <ArrowUpRight size="20" aria-hidden="true" />
            </strong>
            <span>Protect the things that matter.</span>
          </div>
        </div>
      </section>
      <section className={styles.context}>
        <div>
          <span className={styles.sectionKicker}>THE INVISIBLE BARRIER</span>
          <h2>
            Same city.
            <br />
            Different access to time.
          </h2>
        </div>
        <p>
          Work, childcare, transport and public services run on different schedules. People with
          limited flexibility pay the price. ChronoCity connects those timelines so you can see
          which obligations are possible, what a disruption changes, and which alternative really
          works.
        </p>
      </section>
      <section className={styles.features} aria-label="Explore ChronoCity">
        {features.map(({ number, icon: Icon, title, copy, to }) => (
          <Link key={number} to={to} className={styles.feature}>
            <div className={styles.featureTop}>
              <span>{number}</span>
              <Icon size="24" aria-hidden="true" />
            </div>
            <h3>{title}</h3>
            <p>{copy}</p>
            <span className={styles.featureLink}>
              Explore <ArrowUpRight size="18" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </section>
    </>
  );
}
