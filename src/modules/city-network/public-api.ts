export type Place = {
  id: string;
  name: string;
  kind: string;
  x: number;
  y: number;
  open: number;
  close: number;
};
export type Edge = { id: string; a: string; b: string; minutes: number; mode: string };
export type City = { places: Place[]; edges: Edge[] };
export { city } from './dataset';
export { CityMap } from './CityMap';

export function validateCity(city: City): string[] {
  const errors: string[] = [];
  const ids = new Set(city.places.map((place) => place.id));
  if (ids.size !== city.places.length) errors.push('Duplicate location ID.');
  if (new Set(city.edges.map((edge) => edge.id)).size !== city.edges.length)
    errors.push('Duplicate connection ID.');
  for (const place of city.places) {
    if (place.open < 0 || place.close > 1440 || place.open >= place.close)
      errors.push(`Invalid hours for ${place.id}.`);
  }
  for (const edge of city.edges) {
    if (!ids.has(edge.a) || !ids.has(edge.b) || edge.a === edge.b)
      errors.push(`Invalid endpoints for ${edge.id}.`);
    if (!Number.isFinite(edge.minutes) || edge.minutes <= 0)
      errors.push(`Invalid duration for ${edge.id}.`);
  }
  return errors;
}
