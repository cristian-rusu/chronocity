import type { City } from '../city-network/public-api';
import { edgeTime, type Incident } from '../aftershock/public-api';

export type Path = { nodes: string[]; edges: string[]; minutes: number };

/** Earliest-arrival Dijkstra is valid because edge arrival is FIFO. */
export function route(
  city: City,
  from: string,
  to: string,
  depart: number,
  incident: Incident,
  locked?: Path | null,
): Path | null {
  if (locked !== undefined) {
    if (
      !locked ||
      locked.nodes[0] !== from ||
      locked.nodes.at(-1) !== to ||
      locked.nodes.length !== locked.edges.length + 1
    )
      return null;
    let time = depart;
    for (let index = 0; index < locked.edges.length; index++) {
      const edge = city.edges.find((item) => item.id === locked.edges[index]);
      const a = locked.nodes[index];
      const b = locked.nodes[index + 1];
      if (!edge || !((edge.a === a && edge.b === b) || (edge.a === b && edge.b === a))) return null;
      time += edgeTime(edge, time, incident);
    }
    return { ...locked, minutes: time - depart };
  }
  const times = new Map(city.places.map((place) => [place.id, Infinity]));
  if (!times.has(from) || !times.has(to)) return null;
  times.set(from, depart);
  const previous = new Map<string, { node: string; edge: string }>();
  const remaining = new Set(times.keys());
  while (remaining.size) {
    const current = [...remaining].reduce((a, b) => (times.get(a)! <= times.get(b)! ? a : b));
    const arrival = times.get(current)!;
    if (!Number.isFinite(arrival)) break;
    remaining.delete(current);
    if (current === to) break;
    for (const edge of city.edges) {
      const nextNode = edge.a === current ? edge.b : edge.b === current ? edge.a : '';
      if (!remaining.has(nextNode)) continue;
      const nextArrival = arrival + edgeTime(edge, arrival, incident);
      if (nextArrival < times.get(nextNode)!) {
        times.set(nextNode, nextArrival);
        previous.set(nextNode, { node: current, edge: edge.id });
      }
    }
  }
  if (!Number.isFinite(times.get(to))) return null;
  const nodes = [to];
  const edges: string[] = [];
  let current = to;
  while (current !== from) {
    const parent = previous.get(current);
    if (!parent) return null;
    edges.unshift(parent.edge);
    nodes.unshift(parent.node);
    current = parent.node;
  }
  return { nodes, edges, minutes: times.get(to)! - depart };
}
