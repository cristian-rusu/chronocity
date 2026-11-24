import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { OriginalIcon } from '../shared/ui/OriginalIcon';
import { useScenario } from '../contexts/scenario-management/public-api';

const links = [
  { to: '/', label: 'Overview', icon: 'home' },
  { to: '/my-day', label: 'My day', icon: 'plan' },
  { to: '/aftershock', label: 'Aftershock', icon: 'pulse' },
  { to: '/resync', label: 'Re-Sync', icon: 'recover' },
  { to: '/city-lab', label: 'City lab', icon: 'lab' },
];

export function App() {
  const location = useLocation();
  const reset = useScenario((state) => state.reset);
  const storageAvailable = useScenario((state) => state.storageAvailable);
  useEffect(() => {
    const page = links.find((link) => link.to === location.pathname);
    document.title = `${page?.label ?? 'ChronoCity'} — ChronoCity`;
  }, [location.pathname]);
  return <>
    <a className="skip" href="#main">Skip to content</a>
    <header className="header">
      <NavLink to="/" className="brand" aria-label="ChronoCity home">
        <svg width="38" height="38" viewBox="0 0 40 40" fill="none" aria-hidden="true"><rect width="40" height="40" rx="12" fill="#087e6b"/><circle cx="20" cy="20" r="12" stroke="#fff" strokeWidth="1.5"/><path d="M20 10v10l7 4M8 28 32 12" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/><circle cx="20" cy="20" r="2.5" fill="#fff"/></svg>
        <span>chrono<span>city.</span><small>URBAN TIME INTELLIGENCE</small></span>
      </NavLink>
      <nav aria-label="Main navigation">{links.map(({to,label,icon}) => <NavLink key={to} to={to} end={to === '/'} aria-current={location.pathname === to ? 'page' : undefined}><OriginalIcon name={icon as 'home'|'plan'|'pulse'|'recover'|'lab'}/><span>{label}</span></NavLink>)}</nav>
      <div className="header-end"><span className="model-label"><i className="live-dot"/> Demo model</span><button className="icon-btn" type="button" aria-label="Reset all scenarios" title="Reset all scenarios" onClick={() => {if (window.confirm('Reset all activities, disruptions and policies?')) reset();}}><OriginalIcon name="reset"/></button></div>
    </header>
    <main id="main" className={location.pathname === '/' ? 'home-main' : 'workspace'} tabIndex={-1}>
      {!storageAvailable && <div className="notice" role="status">Browser storage is unavailable. Changes can be used in this session only.</div>}
      <Outlet/>
    </main>
    <footer><span>ChronoCity / Achrona · Hack The Future 2026</span><span>Synthetic data · deterministic calculations · {storageAvailable ? 'Local storage' : 'Session only'}</span></footer>
  </>;
}
