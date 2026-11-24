import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Clock3, House, CalendarDays, Activity, RefreshCcw, Building2 } from 'lucide-react';
import styles from './App.module.css';
import { useScenario } from '../contexts/scenario-management/public-api';

const links = [
  { to: '/', label: 'Overview', icon: House },
  { to: '/my-day', label: 'My day', icon: CalendarDays },
  { to: '/aftershock', label: 'Aftershock', icon: Activity },
  { to: '/resync', label: 'Re-Sync', icon: RefreshCcw },
  { to: '/city-lab', label: 'City lab', icon: Building2 },
];

export function App() {
  const location = useLocation();
  const reset = useScenario((state) => state.reset);
  const storageAvailable = useScenario((state) => state.storageAvailable);
  useEffect(() => {
    const page = links.find((link) => link.to === location.pathname);
    document.title = `${page?.label ?? 'ChronoCity'} — ChronoCity`;
  }, [location.pathname]);
  return (
    <>
      <a className={styles.skip} href="#main">
        Skip to content
      </a>
      <header className={styles.header}>
        <NavLink to="/" className={styles.brand}>
          <Clock3 aria-hidden="true" />{' '}
          <span className={styles.brandText}>
            chrono<strong>city.</strong><small>URBAN TIME INTELLIGENCE</small>
          </span>
        </NavLink>
        <nav aria-label="Main navigation" className={styles.nav}>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => (isActive ? styles.active : '')}
            >
              <Icon size="18" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset all plans, disruptions and policies?')) reset();
          }}
        >
          Reset demo
        </button>
      </header>
      <main id="main" className={styles.main} tabIndex={-1}>
        {!storageAvailable && (
          <p role="status" className={styles.notice}>
            Browser storage is unavailable. Changes remain in this session.
          </p>
        )}
        <Outlet />
      </main>
      <footer className={styles.footer}><span>ChronoCity / Achrona · Hack The Future 2026</span><span>Synthetic data · deterministic calculations · local storage</span></footer>
    </>
  );
}
