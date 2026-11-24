import { create } from 'zustand';

type ClockState = {
  time: number;
  playing: boolean;
  speed: number;
  setTime: (time: number) => void;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: number) => void;
  tick: (end: number) => void;
};

export const usePlaybackClock = create<ClockState>((set) => ({
  time: 960,
  playing: false,
  speed: 5,
  setTime: (time) => set({ time }),
  setPlaying: (playing) => set({ playing }),
  setSpeed: (speed) => set({ speed }),
  tick: (end) =>
    set((state) => {
      const next = state.time + state.speed;
      if (next >= end) return { time: end, playing: false };
      return { time: next };
    }),
}));
