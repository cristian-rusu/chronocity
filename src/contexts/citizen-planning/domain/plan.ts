export type Activity = {
  id: string;
  title: string;
  place: string;
  duration: number;
  earliest: number;
  deadline: number;
  deadlineType: 'arrival' | 'finish';
  priority: 'essential' | 'flexible';
  fixedOrder: boolean;
};

export type Plan = { startPlace: string; startTime: number; activities: Activity[] };

export function validateActivity(activity: Activity, locationIds: ReadonlySet<string>): string {
  if (!activity.title.trim()) return 'Enter an activity name.';
  if (!locationIds.has(activity.place)) return 'Choose a location.';
  if (!Number.isInteger(activity.duration) || activity.duration < 1 || activity.duration > 240)
    return 'Duration must be 1–240 minutes.';
  if (
    !Number.isInteger(activity.earliest) ||
    !Number.isInteger(activity.deadline) ||
    activity.earliest < 0 ||
    activity.deadline > 1440 ||
    activity.earliest > activity.deadline
  )
    return 'Enter a valid time window.';
  return '';
}

export function minutesToTime(minutes: number): string {
  if (!Number.isFinite(minutes)) return '—';
  const total = Math.round(minutes);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function timeToMinutes(value: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return NaN;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : NaN;
}
