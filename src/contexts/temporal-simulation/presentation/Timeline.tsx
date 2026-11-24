import type { Result } from '../public-contracts';
import { minutesToTime } from '../../citizen-planning/public-contracts';
import { usePlaybackClock } from '../../../shared/ui/playbackClock';
import { city } from '../../city-network/public-api';

function Playhead({ begin, end }: { begin: number; end: number }) {
  const time = usePlaybackClock((state) => state.time);
  if (time < begin || time > end) return null;
  return (
    <i
      className={'playhead'}
      style={{ left: `${((time - begin) / (end - begin)) * 100}%` }}
      aria-hidden="true"
    />
  );
}

export function Timeline({
  rows,
  start,
}: {
  rows: { label: string; result: Result }[];
  start: number;
}) {
  const end = Math.max(start + 60, ...rows.map((row) => row.result.finish));
  const span = end - start;
  const pct = (minutes: number) => Math.max(0, ((minutes - start) / span) * 100);
  return (
    <div className="timeline">
      <div className={'timeline-axis'}>
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index}>{minutesToTime(Math.round(start + (index * span) / 4))}</span>
        ))}
      </div>
      {rows.map(({ label, result }) => (
        <div className={'timeline-row'} key={label}>
          <div className="timeline-label">
            <strong>{label}</strong>
            <small>
              {result.completed}/{result.steps.length + result.omitted.length} feasible ·{' '}
              {minutesToTime(result.finish)}
            </small>
          </div>
          <div className={'timeline-track'}>
            <Playhead begin={start} end={end} />
            {result.steps.map((step) => (
              <div key={step.activity.id}>
                <span
                  className={`${'segment'} ${'travel'}`}
                  style={{
                    left: `${pct(step.depart)}%`,
                    width: `${pct(step.arrive) - pct(step.depart)}%`,
                  }}
                  title={`Travel ${step.path?.minutes ?? 0} minutes`}
                />
                {step.wait > 0 && (
                  <span
                    className={`${'segment'} ${'wait'}`}
                    style={{
                      left: `${pct(step.arrive)}%`,
                      width: `${pct(step.start) - pct(step.arrive)}%`,
                    }}
                    title={`Wait ${step.wait} minutes`}
                  />
                )}
                <span
                  className={`segment ${step.valid ? 'visit' : 'blocked'} ${step.projected ? 'projected' : ''}`}
                  style={{
                    left: `${pct(step.start)}%`,
                    width: `${pct(step.finish) - pct(step.start)}%`,
                  }}
                  title={`${step.activity.title} ${minutesToTime(step.start)}–${minutesToTime(step.finish)}`}
                >
                  <span>{city.places.find((place) => place.id === step.activity.place)?.name ?? step.activity.place}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className={'timeline-key'}>
        <span>
          <i className={'travel'} /> Travel
        </span>
        <span>
          <i className={'wait'} /> Waiting
        </span>
        <span>
          <i className={'visit'} /> Feasible visit
        </span>
        <span>
          <i className={'blocked'} /> Conflict
        </span>
      </div>
    </div>
  );
}

