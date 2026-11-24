import { Link, useNavigate } from 'react-router-dom';
import { OriginalIcon } from '../shared/ui/OriginalIcon';
import { useJourney } from '../app/model';
import { useScenario } from '../contexts/scenario-management/public-api';
import { defaultIncident } from '../contexts/aftershock/public-api';
import { CityMap } from '../contexts/city-network/presentation/public-api';

const features = [
  {
    number: '01',
    icon: 'plan',
    title: 'Plan around real constraints',
    copy: 'Set your stops, service hours and deadlines. Know whether your day is possible before you leave.',
    to: '/my-day',
  },
  {
    number: '02',
    icon: 'pulse',
    title: 'See the ripple effect',
    copy: 'Simulate a disruption. Follow the consequences across your journey, not just on one train line.',
    to: '/aftershock',
  },
  {
    number: '03',
    icon: 'recover',
    title: 'Reclaim your day',
    copy: 'Compare new routes and activity orders. Keep essential obligations safe, and see what needs postponing.',
    to: '/resync',
  },
  {
    number: '04',
    icon: 'lab',
    title: 'Change the system',
    copy: 'Test city interventions against 60 synthetic residents and a limited budget.',
    to: '/city-lab',
  },
];

export function HomePage() {
  const { base } = useJourney();
  const updateIncident = useScenario((state) => state.updateIncident);
  const reset = useScenario((state) => state.reset);
  const navigate = useNavigate();
  return (
    <>
      <section className={'hero'}>
        <div className={'hero-copy'}>
          <span className="kicker">
            <i className="live-dot" /> HACK THE FUTURE / ACHRONA
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
          <div className={'hero-actions'}>
            <Link className={'btn primary'} to="/my-day">
              Plan my day <OriginalIcon name="arrow" />
            </Link>
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                if (!window.confirm('Load the sample disruption? Your current scenario will be replaced.')) return;
                reset();
                updateIncident({ ...defaultIncident, delay: 30 });
                navigate('/aftershock');
              }}
            >
              <OriginalIcon name="pulse" /> Try a disruption
            </button>
          </div>
          <span className={'hero-note'}>
            <OriginalIcon name="info" /> An interactive prototype with a fictional city and
            calculated scenarios.
          </span>
        </div>
        <div className={'hero-art'}>
          <CityMap result={base} incident={defaultIncident} hero />
          <div className={`${'float-card'} ${'float-top'}`}>
            <small className="kicker">AFTERSHOCK</small>
            <strong>+30 min</strong>
            <span>Tram interruption</span>
          </div>
          <div className={`${'float-card'} ${'float-bottom'}`}>
            <small className="kicker">A BETTER FUTURE</small>
            <strong>
              Find another way <OriginalIcon name="arrow" />
            </strong>
            <span>Protect the things that matter.</span>
          </div>
        </div>
      </section>
      <section className={'home-context'}>
        <div>
          <span className={'kicker'}>THE INVISIBLE BARRIER</span>
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
      <section className="home-cards" aria-label="Explore ChronoCity">
        {features.map(({ number, icon, title, copy, to }) => (
          <Link key={number} to={to} className={'home-card'}>
            <div className="card-top">
              <span>{number}</span>
              <OriginalIcon name={icon as 'plan'|'pulse'|'recover'|'lab'} />
            </div>
            <h3>{title}</h3>
            <p>{copy}</p>
            <span className="card-link">
              Explore <OriginalIcon name="arrow" />
            </span>
          </Link>
        ))}
      </section>
    </>
  );
}

