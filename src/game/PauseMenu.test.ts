import { expect, it } from 'vitest';
import { PauseMenu } from './PauseMenu';
it('stays paused through settings and returns to the menu before resuming', () => {
  const menu = new PauseMenu();
  expect(menu.paused).toBe(false);
  menu.escape();
  expect(menu.page).toBe('menu');
  menu.settings();
  expect(menu.paused).toBe(true);
  menu.escape();
  expect(menu.page).toBe('menu');
  expect(menu.paused).toBe(true);
  menu.escape();
  expect(menu.paused).toBe(false);
});
it('keeps the exited title screen paused, including after settings and Escape', () => {
  const menu = new PauseMenu();
  menu.open();
  menu.exit();
  menu.settings();
  menu.back();
  expect(menu.page).toBe('title');
  menu.escape();
  expect(menu.page).toBe('title');
  expect(menu.paused).toBe(true);
  menu.resume();
  expect(menu.paused).toBe(false);
});
