import { Link } from 'react-router-dom';
import { useState } from 'react';
import { OriginalIcon } from '../shared/ui/OriginalIcon';
import { useJourney } from '../app/model';
import { useScenario } from '../contexts/scenario-management/public-api';
import { Journey } from '../contexts/temporal-simulation/presentation/public-api';
import { minutesToTime } from '../contexts/citizen-planning/public-api';
import { downloadCalendarIcs } from './journey/explanations';

export function AcceptedPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const { plan, candidates } = useJourney();
  const acceptedOrder = useScenario((state) => state.acceptedOrder);
  const acceptedRoutes = useScenario((state) => state.acceptedRoutes);
  const accept = useScenario((state) => state.accept);
  const accepted = candidates.find(
    (candidate) =>
      candidate.order.join('|') === acceptedOrder?.join('|') &&
      (!acceptedRoutes ||
        JSON.stringify(candidate.steps.map((step) => step.path?.edges ?? [])) ===
          JSON.stringify(acceptedRoutes)),
  );
  return (
    <>
      <header className="exec-banner">
        <div>
          <div className="kicker">MY JOURNEY · RECOVERED ITINERARY</div>
          <h1>Your recovered itinerary.</h1>
          <p>Accepted plans remain saved after refresh until the plan or disruption changes.</p>
        </div>
        <Link className="btn secondary" to="/my-journey?step=recovery">
          <OriginalIcon name="back" /> Back to My Journey
        </Link>
      </header>
      {accepted ? (
        <>
          <div className="accepted-banner">
            <OriginalIcon name="check" />
            <div>
              <strong>Schedule reclaimed.</strong>
              <p>
                {accepted.all
                  ? 'All required activities fit.'
                  : `${accepted.omitted.length} deferred activities remain visible.`}
              </p>
            </div>
            <button type="button" className="btn secondary" onClick={() => accept(null)}>
              Undo acceptance
            </button>
          </div>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <div className="kicker">YOUR ACCEPTED FUTURE</div>
                <h2>{accepted.all ? 'A complete recovery' : 'A partial recovery'}</h2>
              </div>
              <span className={`tag ${accepted.all ? 'green' : 'red'}`}>
                {accepted.completed}/{plan.activities.length} feasible · finish{' '}
                {minutesToTime(accepted.finish)}
              </span>
            </div>
            <div className="panel-body">
              <Journey result={accepted} />
              <div className="calendar-export">
                <label>
                  Calendar date
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="btn primary full"
                  disabled={!date}
                  onClick={() => {
                    if (date) downloadCalendarIcs(accepted, date);
                  }}
                >
                  <OriginalIcon name="download" /> Download accepted itinerary (.ics)
                </button>
                <p className="fine">
                  Exports simulated visits and travel blocks for the selected date; deferred visits
                  are not exported.
                </p>
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="panel">
          <div className="panel-heading">
            <h2>No accepted plan</h2>
          </div>
          <div className="panel-body">
            <p>Choose a recovery plan first.</p>
            <Link className="btn primary" to="/my-journey?step=recovery">
              Go to recovery
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
