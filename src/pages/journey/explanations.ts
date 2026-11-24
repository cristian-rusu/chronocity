import { city } from '../../contexts/city-network/public-api';
import { minutesToTime, type Plan } from '../../contexts/citizen-planning/public-api';
import type { Incident } from '../../contexts/aftershock/public-api';
import type { Result, Step } from '../../contexts/temporal-simulation/public-api';

export function placeName(id: string): string {
  return city.places.find((place) => place.id === id)?.name ?? id;
}

export function edgeLabel(edgeId: string): string {
  const edge = city.edges.find((item) => item.id === edgeId);
  if (!edge) return edgeId;
  return `${placeName(edge.a)} → ${placeName(edge.b)} (${edge.mode})`;
}

export function explainConflict(step: Step, incident: Incident): string {
  const destination = city.places.find((place) => place.id === step.activity.place);
  const target = destination?.name ?? step.activity.place;

  if (!step.path || !destination) {
    return `There is no available route to reach ${target}.`;
  }
  if (incident.closure === step.activity.place) {
    return `${target} is closed during this disruption, so "${step.activity.title}" cannot be completed.`;
  }
  if (step.finish > destination.close) {
    return `You arrive at ${target} at ${minutesToTime(step.arrive)}, too late to finish before it closes at ${minutesToTime(destination.close)}.`;
  }
  if (step.activity.deadlineType === 'arrival' && step.arrive > step.activity.deadline) {
    return `Your ${minutesToTime(step.activity.deadline)} arrival deadline at ${target} is now at risk (projected arrival ${minutesToTime(step.arrive)}).`;
  }
  if (step.finish > step.activity.deadline) {
    return `"${step.activity.title}" would finish at ${minutesToTime(step.finish)}, missing your ${minutesToTime(step.activity.deadline)} deadline.`;
  }
  return step.reason;
}

export function summarizeRecoveryChange(
  plan: Plan,
  base: Result,
  disrupted: Result,
  chosen: Result,
  incident: Incident,
): { headline: string; details: string[] } {
  const originalOrder = plan.activities.map((item) => item.id);
  const reordered =
    chosen.order.length === originalOrder.length &&
    chosen.order.some((id, index) => id !== originalOrder[index]);
  const avoidsIncidentEdge =
    incident.delay > 0 &&
    !chosen.steps.some((step) => step.path?.edges.includes(incident.edge));
  const changedRoute = chosen.steps.some((step) => {
    const baseStep = base.steps.find((item) => item.activity.id === step.activity.id);
    return baseStep?.path?.edges.join(',') !== step.path?.edges.join(',');
  });

  let headline = 'Uses a feasible alternative path to keep your day on track.';
  if (chosen.omitted.length > 0 && reordered) {
    headline = `Reorders your remaining stops and defers ${chosen.omitted.length} flexible obligation${chosen.omitted.length > 1 ? 's' : ''} to protect what matters most.`;
  } else if (chosen.omitted.length > 0) {
    headline = `Protects ${chosen.completed} of ${plan.activities.length} obligations by deferring what cannot fit before closing.`;
  } else if (reordered) {
    headline = 'Reorders your daily stops so every deadline and closing time stays protected.';
  } else if (avoidsIncidentEdge) {
    headline = `Keeps your exact stop order and reroutes around the delayed ${edgeLabel(incident.edge)} link.`;
  } else if (changedRoute) {
    headline = 'Adjusts your transit route to absorb the disruption while keeping your schedule intact.';
  }

  const details: string[] = [];
  const rescuedCount = Math.max(0, chosen.completed - disrupted.completed);
  if (rescuedCount > 0) {
    details.push(`Recovers ${rescuedCount} obligation${rescuedCount > 1 ? 's' : ''} put at risk by the delay.`);
  }
  const travelSaved = disrupted.travel - chosen.travel;
  if (travelSaved > 0) {
    details.push(`Saves ${travelSaved} minutes of travel compared to staying on the disrupted route.`);
  } else if (chosen.finish < disrupted.finish) {
    details.push(`Finishes ${disrupted.finish - chosen.finish} minutes earlier than the disrupted itinerary.`);
  }
  const essentialTotal = plan.activities.filter((item) => item.priority === 'essential').length;
  if (essentialTotal > 0 && chosen.essential === essentialTotal) {
    details.push(`All ${essentialTotal} essential deadline${essentialTotal > 1 ? 's' : ''} remain protected.`);
  } else if (essentialTotal > 0) {
    details.push(`${chosen.essential} of ${essentialTotal} essential obligations can still be met.`);
  }

  return { headline, details };
}

export function buildCalendarIcs(result: Result, date: string): string {
  const stamp = (minutes: number) => {
    const day = new Date(`${date}T00:00:00Z`);
    day.setUTCMinutes(minutes);
    return day.toISOString().replace(/[-:]/g, '').slice(0, 15);
  };
  const escape = (value: string) =>
    value
      .replaceAll('\\', '\\\\')
      .replaceAll('\n', '\\n')
      .replaceAll(',', '\\,')
      .replaceAll(';', '\\;');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ChronoCity//Reclaimed itinerary//EN',
    'CALSCALE:GREGORIAN',
  ];
  let index = 0;
  const add = (title: string, start: number, end: number, location: string) => {
    if (end <= start) return;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${date}-${index++}-${Date.now()}@chronocity.local`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${escape(title)}`,
      `LOCATION:${escape(location)}`,
      'END:VEVENT',
    );
  };
  for (const step of result.steps) {
    add(
      `Travel to ${placeName(step.activity.place)}`,
      step.depart,
      step.arrive,
      step.path?.nodes.map(placeName).join(' → ') ?? '',
    );
    add(step.activity.title, step.start, step.finish, placeName(step.activity.place));
  }
  return [...lines, 'END:VCALENDAR'].join('\r\n') + '\r\n';
}

export function downloadCalendarIcs(result: Result, date: string): void {
  const content = buildCalendarIcs(result, date);
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'chronocity-itinerary.ics';
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
