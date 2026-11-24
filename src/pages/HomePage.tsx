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
    title: 'Pick a commuter scenario',
    copy: 'Choose a realistic afternoon schedule or customize stops, service hours, and deadlines.',
    to: '/recovery',
  },
  {
    number: '02',
    icon: 'pulse',
    title: 'Trigger a disruption',
    copy: 'Delay a tram link or close a service and follow the cascading impact across your timeline.',
    to: '/recovery',
  },
  {
    number: '03',
    icon: 'recover',
    title: 'Re-Sync your day',
    copy: 'Compare alternative routes and reordered visits to protect essential obligations.',
    to: '/recovery',
  },
] as const;

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
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                reset();
                updateIncident({ ...defaultIncident, delay: 30 });
                navigate('/recovery');
              }}
            >
              Try disruption recovery <OriginalIcon name="arrow" />
            </button>
            <Link className={'btn ghost'} to="/recovery">
              <OriginalIcon name="pulse" /> Open workspace
            </Link>
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
              <OriginalIcon name={icon} />
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
