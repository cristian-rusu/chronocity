import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { OriginalIcon } from '../shared/ui/OriginalIcon';
import { Playback } from '../shared/ui/Playback';
import { useJourney } from '../app/model';
import { useScenario } from '../contexts/scenario-management/public-api';
import { profiles } from '../contexts/citizen-planning/public-api';
import { calm, defaultIncident } from '../contexts/aftershock/public-api';
import { CityMap } from '../contexts/city-network/presentation/public-api';
import { Timeline } from '../contexts/temporal-simulation/presentation/public-api';
import { PlanStepPanel } from './journey/PlanStepPanel';
import { DisruptionStepPanel } from './journey/DisruptionStepPanel';
import { RecoveryStepPanel } from './journey/RecoveryStepPanel';
import styles from './MyJourneyPage.module.css';

export type JourneyStage = 'plan' | 'disruption' | 'recovery';

const STAGES: { id: JourneyStage; number: string; label: string }[] = [
  { id: 'plan', number: '1', label: 'Plan' },
  { id: 'disruption', number: '2', label: 'Disruption' },
  { id: 'recovery', number: '3', label: 'Recovery' },
];

function parseStage(value: string | null, fallback: JourneyStage): JourneyStage {
  if (value === 'plan' || value === 'disruption' || value === 'recovery') return value;
  return fallback;
}

export function MyJourneyPage({ initialStage = 'plan' }: { initialStage?: JourneyStage }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paramStep = searchParams.get('step');
  const [stage, setStage] = useState<JourneyStage>(() => parseStage(paramStep, initialStage));
  const [selectedCandidateIdx, setSelectedCandidateIdx] = useState(0);
  const [showPlayback, setShowPlayback] = useState(false);

  const { profile, plan, base, disrupted, candidates } = useJourney();
  const incident = useScenario((state) => state.incident);
  const acceptedOrder = useScenario((state) => state.acceptedOrder);
  const acceptedRoutes = useScenario((state) => state.acceptedRoutes);
  const selectProfile = useScenario((state) => state.selectProfile);
  const updatePlan = useScenario((state) => state.updatePlan);
  const saveActivity = useScenario((state) => state.saveActivity);
  const removeActivity = useScenario((state) => state.removeActivity);
  const moveActivity = useScenario((state) => state.moveActivity);
  const updateIncident = useScenario((state) => state.updateIncident);
  const accept = useScenario((state) => state.accept);

  useEffect(() => {
    setStage(parseStage(paramStep, initialStage));
  }, [initialStage, paramStep]);

  const safeCandidateIdx = selectedCandidateIdx < candidates.length ? selectedCandidateIdx : 0;
  const chosen = candidates[safeCandidateIdx] ?? candidates[0];
  const currentProfile = profiles.find((item) => item.id === profile) ?? profiles[0];

  const goToStage = (next: JourneyStage) => {
    setStage(next);
    if (next === 'recovery') setSelectedCandidateIdx(0);
    navigate(next === 'plan' ? '/my-journey' : `/my-journey?step=${next}`, { replace: true });
  };

  const handleSimulateDisruption = () => {
    if (incident.delay === 0 && !incident.closure) {
      updateIncident({ ...defaultIncident, delay: 30 });
    }
    goToStage('disruption');
  };

  const mapResult =
    stage === 'plan' ? base : stage === 'disruption' ? disrupted : chosen ?? disrupted;
  const mapIncident = stage === 'plan' ? calm : incident;
  const mapKicker =
    stage === 'plan'
      ? 'ACHRONA · ORIGINAL JOURNEY'
      : stage === 'disruption'
        ? 'ACHRONA · DISRUPTED ROUTE'
        : 'ACHRONA · RECOVERED ROUTE';
  const mapTitle =
    stage === 'plan'
      ? 'Your normal route across the city'
      : stage === 'disruption'
        ? 'Affected connection and stops at risk'
        : chosen?.all
          ? 'Recommended recovery route'
          : 'Best available recovery route';

  const stageCopy =
    stage === 'plan'
      ? 'Review your daily obligations and see how your normal schedule fits across Achrona.'
      : stage === 'disruption'
        ? 'Introduce a transport delay to see which obligations and deadlines are put at risk.'
        : 'Compare the recommended alternative and reclaim your day before you leave.';

  const timelineRows =
    stage === 'disruption'
      ? [
          { label: 'Original', result: base },
          { label: 'Disrupted', result: disrupted },
        ]
      : stage === 'recovery'
        ? [
            { label: 'Original', result: base },
            { label: 'Disrupted', result: disrupted },
            ...(chosen ? [{ label: 'Recovery', result: chosen }] : []),
          ]
        : [];

  return (
    <>
      <div className={styles.topBar}>
        <div className={styles.headingGroup}>
          <div className="kicker">MY JOURNEY · GUIDED WORKFLOW</div>
          <h1>One disruption shouldn’t ruin your day.</h1>
          <p>{stageCopy}</p>
        </div>

        <nav className={styles.stepper} aria-label="Journey steps">
          {STAGES.map((item, idx) => {
            const active = stage === item.id;
            const currentIdx = STAGES.findIndex((s) => s.id === stage);
            const done = idx < currentIdx;
            return (
              <button
                key={item.id}
                type="button"
                className={`${styles.stepBtn} ${active ? styles.stepBtnActive : ''} ${done ? styles.stepBtnDone : ''}`}
                aria-current={active ? 'step' : undefined}
                onClick={() => {
                  if (item.id === 'disruption') handleSimulateDisruption();
                  else goToStage(item.id);
                }}
              >
                <span className={styles.stepNum}>{done ? '✓' : item.number}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className={styles.profileStrip} role="group" aria-label="Citizen scenario">
        <span className={styles.profileLabel}>Scenario</span>
        {profiles.map((item) => {
          const selected = profile === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.profileChip} ${selected ? styles.profileChipSelected : ''}`}
              aria-pressed={selected}
              onClick={() => {
                selectProfile(item.id);
                setSelectedCandidateIdx(0);
              }}
            >
              <span
                className={`${styles.profileAvatar} ${item.id === 'noah' ? styles.profileAvatarNoah : item.id === 'maya' ? styles.profileAvatarMaya : ''}`}
              >
                {item.initials}
              </span>
              <span className={styles.profileText}>
                <strong>{item.name}</strong>
                <small>{item.role}</small>
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.workspaceGrid}>
        <div className={styles.mapColumn}>
          <CityMap
            result={mapResult}
            incident={mapIncident}
            compactControls
            kicker={mapKicker}
            title={mapTitle}
            onSelectEdge={
              stage === 'disruption'
                ? (edge) => updateIncident({ ...incident, edge })
                : undefined
            }
          />

          <div className={styles.utilityBar}>
            <button
              type="button"
              className={styles.utilityToggle}
              aria-expanded={showPlayback}
              onClick={() => setShowPlayback((open) => !open)}
            >
              <OriginalIcon name="clock" />
              <span>{showPlayback ? 'Hide time playback' : 'Explore time playback'}</span>
            </button>
            <span className={styles.utilityHint}>
              {stage === 'disruption'
                ? 'Tip: click any transport link on the map to disrupt it.'
                : 'Watch how your journey moves across Achrona in real time.'}
            </span>
          </div>

          {showPlayback && (
            <div className={styles.playbackBox}>
              <Playback
                start={plan.startTime}
                end={Math.max(plan.startTime + 60, base.finish, disrupted.finish, chosen?.finish ?? 0)}
              />
            </div>
          )}

          {timelineRows.length > 0 && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <div className="kicker">TIMELINE COMPARISON</div>
                  <h2>
                    {stage === 'disruption'
                      ? 'How the delay shifts your afternoon'
                      : 'Original vs. disrupted vs. recovered'}
                  </h2>
                </div>
              </div>
              <div className="panel-body">
                <Timeline start={plan.startTime} rows={timelineRows} />
                {stage === 'disruption' && (
                  <p className="fine">
                    Disrupted timeline follows your original route so you can see where deadlines
                    break.
                  </p>
                )}
              </div>
            </section>
          )}
        </div>

        <div className={styles.sideColumn}>
          {stage === 'plan' && (
            <PlanStepPanel
              profileName={currentProfile.name}
              plan={plan}
              base={base}
              hasAccepted={Boolean(acceptedOrder)}
              onUpdatePlan={updatePlan}
              onSaveActivity={saveActivity}
              onRemoveActivity={removeActivity}
              onMoveActivity={moveActivity}
              onSimulateDisruption={handleSimulateDisruption}
              onViewAccepted={() => goToStage('recovery')}
            />
          )}

          {stage === 'disruption' && (
            <DisruptionStepPanel
              plan={plan}
              base={base}
              disrupted={disrupted}
              incident={incident}
              onChangeIncident={updateIncident}
              onBackToPlan={() => goToStage('plan')}
              onFindRecovery={() => goToStage('recovery')}
            />
          )}

          {stage === 'recovery' && (
            <RecoveryStepPanel
              plan={plan}
              base={base}
              disrupted={disrupted}
              incident={incident}
              candidates={candidates}
              selectedIndex={safeCandidateIdx}
              acceptedOrder={acceptedOrder}
              acceptedRoutes={acceptedRoutes}
              onSelectCandidate={setSelectedCandidateIdx}
              onAccept={accept}
              onBackToDisruption={() => goToStage('disruption')}
              onBackToPlan={() => goToStage('plan')}
            />
          )}
        </div>
      </div>
    </>
  );
}
