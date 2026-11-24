import { useState } from 'react';
import { Link } from 'react-router-dom';
import { OriginalIcon } from '../shared/ui/OriginalIcon';
import { useScenario } from '../contexts/scenario-management/public-api';
import { useJourney } from '../app/model';
import { Journey, Timeline } from '../contexts/temporal-simulation/presentation/public-api';
import { CityMap } from '../contexts/city-network/presentation/public-api';
import { Playback } from '../shared/ui/Playback';
import { DisruptionPanel } from '../contexts/aftershock/presentation/public-api';
import { minutesToTime } from '../contexts/citizen-planning/public-api';

export function AftershockPage() {
  const { plan, base, disrupted, candidates } = useJourney();
  const incident = useScenario((state) => state.incident);
  const update = useScenario((state) => state.updateIncident);
  const [mode, setMode] = useState<'base' | 'disrupted' | 'recovered'>('disrupted');
  const active = mode === 'base' ? base : mode === 'recovered' ? candidates[0] ?? disrupted : disrupted;
  const affected = disrupted.steps.filter((step) => !step.valid);
  const tabs = <div className="segmented scenario-tabs" aria-label="Displayed scenario">{([['base','Original'],['disrupted','Aftershock'],['recovered','Re-Sync']] as const).map(([value,label]) => <button key={value} type="button" aria-pressed={mode === value} disabled={value === 'recovered' && !candidates[0]} onClick={() => setMode(value)}>{label}</button>)}</div>;
  return <>
    <div className="page-heading"><div><div className="kicker">02 / AFTERSHOCK</div><h1>What if the city changes?</h1><p>Introduce an interruption, see how the original journey breaks, and understand which deadlines are at risk.</p></div><Link className="btn primary" to="/resync">Find recovery plans <OriginalIcon name="recover"/></Link></div>
    <div className="stat-grid"><div className="stat"><span>Original plan</span><strong>{base.completed}/{plan.activities.length}</strong><small>Feasible obligations</small></div><div className={`stat ${affected.length ? 'bad-stat' : ''}`}><span>Aftershock</span><strong>{disrupted.completed}/{plan.activities.length}</strong><small>Projected feasible obligations</small></div><div className={`stat ${affected.length ? 'bad-stat' : ''}`}><span>Conflicts</span><strong>{affected.length}</strong><small>Service or deadline violations</small></div><div className="stat"><span>Extra travel</span><strong>{Math.max(0, disrupted.travel - base.travel)}m</strong><small>On the original route</small></div></div>
    <div className="two-col simulation-grid"><div><CityMap result={active} incident={mode === 'base' ? undefined : incident} onSelectEdge={(edge) => update({ ...incident, edge })}/><Playback start={plan.startTime} end={Math.max(plan.startTime + 1, disrupted.finish, base.finish)}/><section className="panel timeline-panel"><div className="panel-heading"><div><div className="kicker">TEMPORAL X-RAY</div><h2>One disruption. A chain of consequences.</h2></div>{tabs}</div><div className="panel-body"><Timeline start={plan.startTime} rows={[{label:'Original',result:base},{label:'Aftershock',result:disrupted},...(candidates[0] ? [{label:'Re-Sync',result:candidates[0]}] : [])]}/><p className="fine">Aftershock follows the original route. Timing after a blocked visit is hypothetical.</p></div></section></div>
    <aside><DisruptionPanel incident={incident} onChange={update}/><section className="panel impact-panel"><div className="panel-heading"><h2>What breaks?</h2></div><div className="panel-body">{affected.length ? affected.map((step,index) => <div className="impact-item" key={step.activity.id}><span className="impact-no">{String(index+1).padStart(2,'0')}</span><div><strong>{step.activity.title}</strong><p>{step.reason}</p><small>Projected {minutesToTime(step.start)}–{minutesToTime(step.finish)}</small></div></div>) : <div className="callout success"><strong>No conflicts in this projected itinerary.</strong><p>Try a +30 minute delay on Central Station — City Hall to see the ripple effect.</p></div>}<Link className="btn primary full" to="/resync">Find feasible alternatives <OriginalIcon name="arrow"/></Link></div></section></aside></div>
    <section className="panel detail-panel"><div className="panel-heading"><h2>Inspect the {mode === 'base' ? 'original' : mode === 'recovered' ? 'recovered' : 'disrupted'} itinerary</h2>{tabs}</div><div className="panel-body"><Journey result={active}/></div></section>
  </>;
}
