import { Link } from 'react-router-dom';
import { useState } from 'react';
import { OriginalIcon } from '../shared/ui/OriginalIcon';
import { useJourney } from '../app/model';
import { useScenario } from '../contexts/scenario-management/public-api';
import { Journey } from '../contexts/temporal-simulation/presentation/public-api';
import { minutesToTime } from '../contexts/citizen-planning/public-api';
import { city } from '../contexts/city-network/public-api';

function download(content: string) { const url = URL.createObjectURL(new Blob([content], { type:'text/calendar' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'chronocity-itinerary.ics'; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
function calendar(result: NonNullable<ReturnType<typeof useJourney>['candidates'][number]>, date: string) {
  const stamp = (minutes: number) => { const day = new Date(`${date}T00:00:00Z`); day.setUTCMinutes(minutes); return day.toISOString().replace(/[-:]/g, '').slice(0, 15); };
  const escape = (value: string) => value.replaceAll('\\', '\\\\').replaceAll('\n', '\\n').replaceAll(',', '\\,').replaceAll(';', '\\;');
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//ChronoCity//Reclaimed itinerary//EN','CALSCALE:GREGORIAN']; let index = 0;
  const add = (title: string, start: number, end: number, location: string) => { if (end <= start) return; lines.push('BEGIN:VEVENT',`UID:${date}-${index++}-${Date.now()}@chronocity.local`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').split('.')[0]}Z`,`DTSTART:${stamp(start)}`,`DTEND:${stamp(end)}`,`SUMMARY:${escape(title)}`,`LOCATION:${escape(location)}`,'END:VEVENT'); };
  const name = (id: string) => city.places.find((place) => place.id === id)?.name ?? id;
  for (const step of result.steps) { add('Travel to ' + name(step.activity.place),step.depart,step.arrive,step.path?.nodes.map(name).join(' → ') ?? ''); add(step.activity.title,step.start,step.finish,name(step.activity.place)); }
  return [...lines,'END:VCALENDAR'].join('\r\n') + '\r\n';
}

export function AcceptedPage() {
  const [date, setDate] = useState('');
  const { plan, candidates } = useJourney();
  const acceptedOrder = useScenario((state) => state.acceptedOrder);
  const acceptedRoutes = useScenario((state) => state.acceptedRoutes);
  const accept = useScenario((state) => state.accept);
  const accepted = candidates.find((candidate) => candidate.order.join('|') === acceptedOrder?.join('|') && (!acceptedRoutes || JSON.stringify(candidate.steps.map((step) => step.path?.edges ?? [])) === JSON.stringify(acceptedRoutes)));
  return <>
    <div className="page-heading"><div><div className="kicker">03 / RE-SYNC</div><h1>Your recovered itinerary.</h1><p>Accepted plans remain available after refresh until the plan or disruption changes.</p></div><Link className="btn secondary" to="/resync"><OriginalIcon name="back"/>Back to Re-Sync</Link></div>
    {accepted ? <><div className="accepted-banner"><OriginalIcon name="check"/><div><strong>Schedule reclaimed.</strong><p>{accepted.all ? 'All required activities fit.' : `${accepted.omitted.length} deferred activities remain visible.`}</p></div><button type="button" className="btn secondary" onClick={() => accept(null)}>Undo acceptance</button></div><section className="panel"><div className="panel-heading"><div><div className="kicker">YOUR ACCEPTED FUTURE</div><h2>{accepted.all ? 'A complete recovery' : 'A partial recovery'}</h2></div><span className={`tag ${accepted.all ? 'green' : 'red'}`}>{accepted.completed}/{plan.activities.length} feasible · finish {minutesToTime(accepted.finish)}</span></div><div className="panel-body"><Journey result={accepted}/><div className="calendar-export"><label>Calendar date<input type="date" value={date} onChange={(event) => setDate(event.target.value)}/></label><button type="button" className="btn primary full" disabled={!date} onClick={() => { if (date) download(calendar(accepted,date)); }}><OriginalIcon name="download"/>Download accepted itinerary (.ics)</button><p className="fine">Exports simulated visits and travel blocks for the selected date; deferred visits are not exported.</p></div></div></section></> : <section className="panel"><div className="panel-heading"><h2>No accepted plan</h2></div><div className="panel-body"><p>Choose a recovery candidate first.</p><Link className="btn primary" to="/resync">View alternatives</Link></div></section>}
  </>;
}
