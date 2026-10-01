import { afterEach, expect, it, vi } from 'vitest';
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import { createLowDetailVisual, createVeryLowDetailVisual } from './lowDetailVisual';

afterEach(() => vi.restoreAllMocks());

it('does not call Object3D.add with an empty unmerged mesh list', () => {
  const source = new Group();
  source.add(new Mesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial()));
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

  createLowDetailVisual(source, 'test-asset');
  createVeryLowDetailVisual(source, 'test-asset');

  expect(consoleError).not.toHaveBeenCalled();
});
