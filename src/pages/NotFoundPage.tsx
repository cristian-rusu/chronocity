import { Link } from 'react-router-dom';
import styles from './Page.module.css';
export function NotFoundPage() {
  return (
    <section className={styles.intro}>
      <h1>Page not found</h1>
      <p>The requested route does not exist.</p>
      <Link to="/">Return to overview</Link>
    </section>
  );
}
