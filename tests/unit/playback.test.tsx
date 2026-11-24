import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Playback } from '../../src/shared/ui/Playback';
import { usePlaybackClock } from '../../src/shared/ui/playbackClock';

beforeEach(() => {
  usePlaybackClock.setState({ time: 960, playing: false, speed: 5 });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it('preserves speed select focus during playback', async () => {
  const user = userEvent.setup();
  render(<Playback start={960} end={1080} />);
  const speed = screen.getByLabelText('Playback speed');
  await user.click(speed);
  await user.selectOptions(speed, '15');
  await user.click(screen.getByRole('button', { name: 'Start time playback' }));
  await user.click(speed);
  expect(document.activeElement).toBe(speed);
});

it('advances shared clock during playback and stops at end', () => {
  vi.useFakeTimers();
  render(<Playback start={960} end={968} />);
  fireEvent.click(screen.getByRole('button', { name: 'Start time playback' }));
  expect(usePlaybackClock.getState().playing).toBe(true);
  act(() => {
    vi.advanceTimersByTime(500);
  });
  expect(usePlaybackClock.getState().time).toBe(965);
  expect(usePlaybackClock.getState().playing).toBe(true);
  act(() => {
    vi.advanceTimersByTime(500);
  });
  expect(usePlaybackClock.getState().time).toBe(968);
  expect(usePlaybackClock.getState().playing).toBe(false);
});

it('updates shared clock on slider change and reset', async () => {
  const user = userEvent.setup();
  render(<Playback start={960} end={1080} />);
  const slider = screen.getByLabelText('Explore time');
  fireEvent.change(slider, { target: { value: '1010' } });
  expect(usePlaybackClock.getState().time).toBe(1010);
  await user.click(screen.getByRole('button', { name: 'Reset' }));
  expect(usePlaybackClock.getState().time).toBe(960);
  expect(usePlaybackClock.getState().playing).toBe(false);
});

it('resets shared clock when rendered range excludes current time', () => {
  usePlaybackClock.setState({ time: 1100, playing: true, speed: 5 });
  const { rerender } = render(<Playback start={930} end={1050} />);
  expect(usePlaybackClock.getState().time).toBe(930);
  expect(usePlaybackClock.getState().playing).toBe(false);
  rerender(<Playback start={980} end={1060} />);
  expect(usePlaybackClock.getState().time).toBe(980);
});
