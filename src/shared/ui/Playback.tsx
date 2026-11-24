import { useEffect } from 'react';
import { OriginalIcon } from './OriginalIcon';
import { usePlaybackClock } from './playbackClock';

const label = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export function Playback({ start: _start, end: _end }: { start: number; end: number }) {
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
      if (next >= 1260) {
        setTime(1260);
        setPlaying(false);
      } else setTime(next);
    }, 500);
    return () => window.clearInterval(timer);
  }, [playing, setPlaying, setTime]);
  return <div className="playback">
    <button className="play-button" type="button" aria-label={playing ? 'Pause time playback' : 'Start time playback'} onClick={() => {
      if (playing) setPlaying(false);
      else { if (time >= 1260) setTime(420); setPlaying(true); }
    }}>{playing ? <OriginalIcon name="pause"/> : <OriginalIcon name="play"/>}</button>
    <div className="clock-track"><div><label htmlFor="clock">Explore time</label><output id="clock-label" htmlFor="clock">{label(time)}</output></div>
      <input type="range" id="clock" min="420" max="1260" step="5" value={time} onChange={(event) => {setPlaying(false);setTime(Number(event.target.value));}}/>
      <div className="clock-ticks"><span>07:00</span><span>11:40</span><span>16:20</span><span>21:00</span></div>
    </div>
    <label className="speed-label">Speed<select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}><option value="1">1 min/tick</option><option value="5">5 min/tick</option><option value="15">15 min/tick</option></select></label>
  </div>;
}
