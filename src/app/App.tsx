import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { OriginalIcon } from '../shared/ui/OriginalIcon';
import { useScenario } from '../contexts/scenario-management/public-api';

const links = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/my-journey', label: 'My Journey', icon: 'plan' },
  { to: '/city-lab', label: 'City Lab', icon: 'lab' },
] as const;

const journeyPaths = ['/my-journey', '/my-day', '/aftershock', '/resync', '/my-day/accepted'];

export function App() {
  const location = useLocation();
  const reset = useScenario((state) => state.reset);
  const storageAvailable = useScenario((state) => state.storageAvailable);
  const isJourneyRoute = journeyPaths.includes(location.pathname);

  useEffect(() => {
    const title = isJourneyRoute
      ? 'My Journey'
      : links.find((link) => link.to === location.pathname)?.label ?? 'ChronoCity';
    document.title = `${title} — ChronoCity`;
  }, [isJourneyRoute, location.pathname]);

  return <>
    <a className="skip" href="#main">Skip to content</a>
    <header className="header">
      <NavLink to="/" className="brand" aria-label="ChronoCity home">
        <svg width="38" height="38" viewBox="0 0 40 40" fill="none" aria-hidden="true"><rect width="40" height="40" rx="12" fill="#087e6b"/><circle cx="20" cy="20" r="12" stroke="#fff" strokeWidth="1.5"/><path d="M20 10v10l7 4M8 28 32 12" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/><circle cx="20" cy="20" r="2.5" fill="#fff"/></svg>
        <span>chrono<span>city.</span><small>URBAN TIME INTELLIGENCE</small></span>
      </NavLink>
      <nav aria-label="Main navigation">
        {links.map(({ to, label, icon }) => {
          const active = to === '/my-journey' ? isJourneyRoute : location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              aria-current={active ? 'page' : undefined}
            >
              <OriginalIcon name={icon} />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="header-end"><span className="model-label"><i className="live-dot"/> Demo model</span><button className="icon-btn" type="button" aria-label="Reset all scenarios" title="Reset all scenarios" onClick={() => {if (window.confirm('Reset all activities, disruptions and policies?')) reset();}}><OriginalIcon name="reset"/></button></div>
    </header>
    <main id="main" className={location.pathname === '/' ? 'home-main' : 'workspace'} tabIndex={-1}>
      {!storageAvailable && <div className="notice" role="status">Browser storage is unavailable. Changes can be used in this session only.</div>}
      <Outlet/>
    </main>
    <footer><span>ChronoCity / Achrona · Hack The Future 2026</span><span>Synthetic data · deterministic calculations · {storageAvailable ? 'Local storage' : 'Session only'}</span></footer>
  </>;
}
