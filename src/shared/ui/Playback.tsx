import { useEffect } from 'react';
import { OriginalIcon } from './OriginalIcon';
import { usePlaybackClock } from './playbackClock';

const label = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export function Playback({ start, end }: { start: number; end: number }) {
  const min = Math.min(start, end);
  const max = Math.max(start + 15, end);
  const time = usePlaybackClock((state) => state.time);
  const playing = usePlaybackClock((state) => state.playing);
  const speed = usePlaybackClock((state) => state.speed);
  const setTime = usePlaybackClock((state) => state.setTime);
  const setPlaying = usePlaybackClock((state) => state.setPlaying);
  const setSpeed = usePlaybackClock((state) => state.setSpeed);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      const next = usePlaybackClock.getState().time + usePlaybackClock.getState().speed;
      if (next >= max) {
        setTime(max);
        setPlaying(false);
      } else {
        setTime(next);
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [max, playing, setPlaying, setTime]);

  const current = Math.max(min, Math.min(max, time));
  const ticks = [0, 1, 2, 3].map((i) => label(Math.round(min + ((max - min) * i) / 3)));

  return (
    <div className="playback">
      <button
        className="play-button"
        type="button"
        aria-label={playing ? 'Pause time playback' : 'Start time playback'}
        onClick={() => {
          if (playing) setPlaying(false);
          else {
            if (time < min || time >= max) setTime(min);
            setPlaying(true);
          }
        }}
      >
        {playing ? <OriginalIcon name="pause" /> : <OriginalIcon name="play" />}
      </button>
      <div className="clock-track">
        <div>
          <label htmlFor="clock">Explore time</label>
          <output id="clock-label" htmlFor="clock">
            {label(current)}
          </output>
        </div>
        <input
          type="range"
          id="clock"
          min={min}
          max={max}
          step="5"
          value={current}
          onChange={(event) => {
            setPlaying(false);
            setTime(Number(event.target.value));
          }}
        />
        <div className="clock-ticks">
          {ticks.map((tick, index) => (
            <span key={`${tick}-${index}`}>{tick}</span>
          ))}
        </div>
      </div>
      <label className="speed-label">
        Speed
        <select
          aria-label="Playback speed"
          value={speed}
          onChange={(event) => setSpeed(Number(event.target.value))}
        >
          <option value="1">1 min/tick</option>
          <option value="5">5 min/tick</option>
          <option value="15">15 min/tick</option>
        </select>
      </label>
    </div>
  );
}
