import { create } from 'zustand';

type ClockState = {
  time: number;
  playing: boolean;
  speed: number;
  setTime: (time: number) => void;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: number) => void;
};

export const usePlaybackClock = create<ClockState>((set) => ({
  time: 960,
  playing: false,
  speed: 5,
  setTime: (time) => set({ time }),
  setPlaying: (playing) => set({ playing }),
  setSpeed: (speed) => set({ speed }),
}));
