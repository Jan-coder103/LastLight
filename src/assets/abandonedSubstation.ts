import type { AuthoredAsset } from './assetTypes';
import { electricalSubstation } from './electricalSubstation';

/** The approved stripped-yard appearance of the electrical substation asset. */
export const abandonedSubstation: AuthoredAsset = {
  ...electricalSubstation,
  id: 'abandoned-substation',
  name: 'Abandoned Substation',
  createVisual() {
    return electricalSubstation.createVisual(2);
  },
};
