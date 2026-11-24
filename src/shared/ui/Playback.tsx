import { useEffect } from 'react';
import { OriginalIcon } from './OriginalIcon';
import { usePlaybackClock } from './playbackClock';

const label = (minutes: number) => {
  const rounded = Math.round(minutes);
  return `${String(Math.floor(rounded / 60)).padStart(2, '0')}:${String(rounded % 60).padStart(2, '0')}`;
};

export function Playback({ start, end }: { start: number; end: number }) {
  const time = usePlaybackClock((state) => state.time);
  const playing = usePlaybackClock((state) => state.playing);
  const speed = usePlaybackClock((state) => state.speed);
  const setTime = usePlaybackClock((state) => state.setTime);
  const setPlaying = usePlaybackClock((state) => state.setPlaying);
  const setSpeed = usePlaybackClock((state) => state.setSpeed);
  const tick = usePlaybackClock((state) => state.tick);
  useEffect(() => {
    const current = usePlaybackClock.getState().time;
    if (current < start || current > end) {
      setPlaying(false);
      setTime(start);
    }
  }, [start, end, setPlaying, setTime]);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => tick(end), 500);
    return () => window.clearInterval(timer);
  }, [playing, end, tick]);
  useEffect(() => () => setPlaying(false), [setPlaying]);
  const clampedTime = Math.min(end, Math.max(start, time));
  return (
    <div className="playback">
      <button
        className="play-button"
        type="button"
        aria-label={playing ? 'Pause time playback' : 'Start time playback'}
        onClick={() => {
          if (playing) setPlaying(false);
          else {
            if (time >= end) setTime(start);
            setPlaying(true);
          }
        }}
      >
        {playing ? <OriginalIcon name="pause" /> : <OriginalIcon name="play" />}
      </button>
      <button
        className="icon-btn"
        type="button"
        aria-label="Reset"
        title="Reset playback"
        onClick={() => {
          setPlaying(false);
          setTime(start);
        }}
      >
        <OriginalIcon name="reset" />
      </button>
      <div className="clock-track">
        <div>
          <label htmlFor="clock">Explore time</label>
          <output id="clock-label" htmlFor="clock">
            {label(clampedTime)}
          </output>
        </div>
        <input
          type="range"
          id="clock"
          min={start}
          max={end}
          step={1}
          value={clampedTime}
          onChange={(event) => {
            setPlaying(false);
            setTime(Number(event.target.value));
          }}
        />
        <div className="clock-ticks">
          <span>{label(start)}</span>
          <span>{label(Math.round((start + end) / 2))}</span>
          <span>{label(end)}</span>
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
