import React from 'react';
import { act, render } from '@testing-library/react';
import { animate } from 'animejs';
import { useEntranceAnimation } from '@/lib/hooks/useEntranceAnimation';

jest.mock('animejs', () => ({ animate: jest.fn() }));
const revert = jest.fn();
let preference: { matches: boolean; addEventListener: jest.Mock; removeEventListener: jest.Mock };
function Example({ view = 'dashboard' }) {
  return <div ref={useEntranceAnimation(view)}>Content</div>;
}
beforeEach(() => {
  preference = { matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() };
  window.matchMedia = jest.fn().mockReturnValue(preference);
  jest.mocked(animate).mockReturnValue({ revert } as any);
});

test('starts an animation and cleans it up on navigation and unmount', () => {
  const { rerender, unmount } = render(<Example />);
  expect(animate).toHaveBeenCalledTimes(1);
  rerender(<Example view="settings" />);
  expect(revert).toHaveBeenCalledTimes(1);
  expect(animate).toHaveBeenCalledTimes(2);
  unmount();
  expect(revert).toHaveBeenCalledTimes(2);
  expect(preference.removeEventListener).toHaveBeenCalled();
});

test('skips animation when reduced motion is enabled', () => {
  preference.matches = true;
  render(<Example />);
  expect(animate).not.toHaveBeenCalled();
});

test('immediately reverts motion when the system preference changes', () => {
  render(<Example />);
  preference.matches = true;
  act(() => preference.addEventListener.mock.calls[0][1]());
  expect(revert).toHaveBeenCalledTimes(1);
  expect(animate).toHaveBeenCalledTimes(1);
});
