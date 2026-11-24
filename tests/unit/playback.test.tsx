import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { Playback } from '../../src/shared/ui/Playback';

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
