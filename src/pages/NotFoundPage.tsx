import { Link } from 'react-router-dom';
export function NotFoundPage() {
  return (
    <section className={'page-heading'}>
      <h1>Page not found</h1>
      <p>The requested route does not exist.</p>
      <Link className="btn primary" to="/">Return to Home</Link>
    </section>
  );
}

