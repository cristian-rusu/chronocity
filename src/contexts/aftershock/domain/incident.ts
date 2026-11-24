export type Incident = { edge: string; delay: number; start: number; end: number; closure: string };
export const defaultIncident: Incident = {
  edge: 'central-hall',
  delay: 30,
  start: 960,
  end: 1080,
  closure: '',
};
export const calm: Incident = { ...defaultIncident, delay: 0 };

// Waiting until an incident ends is allowed. This makes edge arrival FIFO.
export function edgeTime(
  edge: { id: string; minutes: number },
  depart: number,
  incident: Incident,
): number {
  const active = edge.id === incident.edge && depart >= incident.start && depart < incident.end;
  return edge.minutes + (active ? Math.min(incident.delay, incident.end - depart) : 0);
}
