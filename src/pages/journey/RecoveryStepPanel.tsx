import { useState } from 'react';
import { OriginalIcon } from '../../shared/ui/OriginalIcon';
import { minutesToTime, type Plan } from '../../contexts/citizen-planning/public-api';
import type { Incident } from '../../contexts/aftershock/public-api';
import type { Result } from '../../contexts/temporal-simulation/public-api';
import { Journey } from '../../contexts/temporal-simulation/presentation/public-api';
import { downloadCalendarIcs, placeName, summarizeRecoveryChange } from './explanations';
import styles from '../MyJourneyPage.module.css';

export function RecoveryStepPanel({
  plan,
  base,
  disrupted,
  incident,
  candidates,
  selectedIndex,
  acceptedOrder,
  acceptedRoutes,
  highlightedPlaceId,
  onFocusPlace,
  onSelectCandidate,
  onAccept,
  onBackToDisruption,
  onBackToPlan,
}: {
  plan: Plan;
  base: Result;
  disrupted: Result;
  incident: Incident;
  candidates: Result[];
  selectedIndex: number;
  acceptedOrder: string[] | null;
  acceptedRoutes: string[][] | null | undefined;
  highlightedPlaceId: string | null;
  onFocusPlace: (placeId: string | null) => void;
  onSelectCandidate: (index: number) => void;
  onAccept: (order: string[] | null, routes?: string[][] | null) => void;
  onBackToDisruption: () => void;
  onBackToPlan: () => void;
}) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(() => new Date().toISOString().slice(0, 10));

  const chosen = candidates[selectedIndex] ?? candidates[0];
  const essentialTotal = plan.activities.filter((item) => item.priority === 'essential').length;

  const matchesAccepted = Boolean(
    chosen &&
      acceptedOrder &&
      chosen.order.join('|') === acceptedOrder.join('|') &&
      (!acceptedRoutes ||
        JSON.stringify(chosen.steps.map((step) => step.path?.edges ?? [])) ===
          JSON.stringify(acceptedRoutes)),
  );

  const summary = chosen
    ? summarizeRecoveryChange(plan, base, disrupted, chosen, incident)
    : null;
  const travelSaved = chosen ? disrupted.travel - chosen.travel : 0;

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <div className="kicker">STEP 3 · RECOMMENDED RECOVERY</div>
          <h2>
            {!chosen
              ? 'No feasible recovery found'
              : chosen.all
                ? 'Reclaim your day'
                : 'Best partial recovery'}
          </h2>
        </div>
        {chosen && (
          <span className={`tag ${chosen.all ? 'green' : 'red'}`}>
            {chosen.completed}/{plan.activities.length} recovered
          </span>
        )}
      </div>

      <div className="panel-body">
        {!chosen ? (
          <>
            <div className="callout warning">
              <strong>No obligation can be completed under this disruption.</strong>
              <p>
                ChronoCity never suggests an impossible schedule. Try reducing the disruption or
                adjusting one of your deadlines.
              </p>
            </div>
            <div className={styles.stepFoot}>
              <button type="button" className="btn secondary full" onClick={onBackToDisruption}>
                <OriginalIcon name="back" /> Adjust disruption
              </button>
              <button type="button" className={styles.linkBtn} onClick={onBackToPlan}>
                Edit daily obligations
              </button>
            </div>
          </>
        ) : (
          <>
            {matchesAccepted && (
              <div className={styles.acceptedSummary} role="status">
                <div className={styles.acceptedHeader}>
                  <span className={styles.acceptedIcon}>
                    <OriginalIcon name="check" />
                  </span>
                  <div>
                    <strong>
                      {chosen.all ? 'Your day is reclaimed.' : 'Partial recovery saved.'}
                    </strong>
                    <p>
                      {chosen.completed} of {plan.activities.length} obligations scheduled ·
                      finishes at {minutesToTime(chosen.finish)}.
                      {chosen.omitted.length > 0
                        ? ` ${chosen.omitted.length} deferred obligation${chosen.omitted.length > 1 ? 's remain' : ' remains'} visible below.`
                        : ' All essential deadlines are protected.'}
                    </p>
                  </div>
                </div>
                <div className={styles.acceptedActions}>
                  <button
                    type="button"
                    className="btn secondary"
                    aria-expanded={showCalendar}
                    onClick={() => setShowCalendar((open) => !open)}
                  >
                    <OriginalIcon name="download" /> Export to calendar (.ics)
                  </button>
                  <button
                    type="button"
                    className="btn small"
                    onClick={() => onAccept(null)}
                  >
                    Undo acceptance
                  </button>
                </div>
                {showCalendar && (
                  <div className={styles.calendarBox}>
                    <label>
                      Calendar date
                      <input
                        type="date"
                        value={calendarDate}
                        onChange={(event) => setCalendarDate(event.target.value)}
                      />
                    </label>
                    <button
                      type="button"
                      className="btn primary full"
                      disabled={!calendarDate}
                      onClick={() => {
                        if (calendarDate) downloadCalendarIcs(chosen, calendarDate);
                      }}
                    >
                      <OriginalIcon name="download" /> Download itinerary (.ics)
                    </button>
                    <p className="fine">
                      Exports travel blocks and confirmed visits for the chosen date.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className={styles.metricPills}>
              <span
                className={`${styles.metricPill} ${chosen.all ? styles.metricPillGood : styles.metricPillAlert}`}
              >
                {chosen.completed}/{plan.activities.length} obligations feasible
              </span>
              {essentialTotal > 0 && (
                <span
                  className={`${styles.metricPill} ${chosen.essential === essentialTotal ? styles.metricPillGood : styles.metricPillAlert}`}
                >
                  {chosen.essential}/{essentialTotal} essential safe
                </span>
              )}
              {travelSaved > 0 ? (
                <span className={`${styles.metricPill} ${styles.metricPillGood}`}>
                  {travelSaved}m travel saved
                </span>
              ) : (
                <span className={styles.metricPill}>Finish {minutesToTime(chosen.finish)}</span>
              )}
            </div>

            {summary && (
              <div
                className={`${styles.recoveryHighlight} ${!chosen.all ? styles.recoveryHighlightPartial : ''}`}
              >
                <h3>{summary.headline}</h3>
                {summary.details.length > 0 && (
                  <ul className={styles.gainList}>
                    {summary.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <p className={styles.mapFocusHint}>
              Hover or click any recovered stop to highlight its path on the map.
            </p>
            <Journey
              result={chosen}
              highlightedPlaceId={highlightedPlaceId}
              onFocusPlace={onFocusPlace}
            />

            {candidates.length > 1 && (
              <>
                <button
                  type="button"
                  className={`${styles.disclosureBtn} ${showAlternatives ? styles.disclosureBtnOpen : ''}`}
                  aria-expanded={showAlternatives}
                  onClick={() => setShowAlternatives((open) => !open)}
                >
                  <span>
                    View other alternatives ({candidates.length - 1} more)
                  </span>
                  <OriginalIcon name="chevron" />
                </button>
                {showAlternatives && (
                  <div className="candidate-list">
                    {candidates.map((candidate, at) => (
                      <button
                        type="button"
                        key={`${candidate.order.join('-')}-${at}`}
                        className={`candidate ${at === selectedIndex ? 'selected' : ''}`}
                        aria-pressed={at === selectedIndex}
                        onClick={() => onSelectCandidate(at)}
                      >
                        <div>
                          <span className={`tag ${at === 0 ? 'green' : ''}`}>
                            {at === 0 ? 'Recommended' : candidate.label}
                          </span>
                          <strong>
                            {candidate.label === 'Reroute'
                              ? 'Keep activity order'
                              : candidate.label}
                          </strong>
                          <small>
                            {candidate.steps.map((step) => placeName(step.activity.place)).join(' → ')}
                          </small>
                          <small>
                            Finish {minutesToTime(candidate.finish)} · Travel {candidate.travel}m
                            {candidate.omitted.length
                              ? ` · ${candidate.omitted.length} deferred`
                              : ''}
                          </small>
                        </div>
                        <b>
                          {candidate.completed}/{plan.activities.length}
                        </b>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className={styles.stepFoot}>
              {!matchesAccepted && (
                <button
                  type="button"
                  className="btn primary full"
                  onClick={() => {
                    if (
                      chosen.all ||
                      window.confirm(
                        'Accept this partial recovery? Unrecoverable obligations will remain clearly listed.',
                      )
                    ) {
                      onAccept(
                        chosen.order,
                        chosen.steps.map((step) => step.path?.edges ?? []),
                      );
                    }
                  }}
                >
                  {chosen.all ? 'Reclaim my day' : 'Accept partial recovery'}{' '}
                  <OriginalIcon name="check" />
                </button>
              )}

              <div className={styles.secondaryNavRow}>
                <button type="button" className={styles.linkBtn} onClick={onBackToDisruption}>
                  <OriginalIcon name="back" /> Adjust disruption
                </button>
                <button type="button" className={styles.linkBtn} onClick={onBackToPlan}>
                  Edit plan
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
