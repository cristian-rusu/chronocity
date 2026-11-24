import { useEffect, useState } from 'react';
import styles from './Playback.module.css';

const clockLabel = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export function Playback({ start, end }: { start: number; end: number }) {
  const [time, setTime] = useState(start);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(5);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () =>
        setTime((current) => {
          if (current + speed >= end) {
            setPlaying(false);
            return end;
          }
          return current + speed;
        }),
      500,
    );
    return () => window.clearInterval(timer);
  }, [playing, speed, end]);
  return (
    <div className={styles.playback}>
      <button
        type="button"
        onClick={() => {
          if (time >= end) setTime(start);
          setPlaying(!playing);
        }}
        aria-label={playing ? 'Pause time playback' : 'Start time playback'}
      >
        {playing ? 'Pause' : 'Play'}
      </button>
      <button
        type="button"
        onClick={() => {
          setPlaying(false);
          setTime(start);
        }}
      >
        Reset
      </button>
      <label>
        Simulation time{' '}
        <input
          type="range"
          min={start}
          max={end}
          value={time}
          onChange={(event) => {
            setPlaying(false);
            setTime(Number(event.target.value));
          }}
        />
      </label>
      <output>{clockLabel(time)}</output>
      <label>
        Playback speed{' '}
        <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
          <option value="1">1 minute</option>
          <option value="5">5 minutes</option>
          <option value="15">15 minutes</option>
        </select>
      </label>
    </div>
  );
}
