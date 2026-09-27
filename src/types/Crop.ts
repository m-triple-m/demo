/**
 * Crop domain types.
 * Data-driven crop definitions keep farming logic separate from crop data.
 */

import type { Season } from './GameTime';

export interface CropDefinition {
  id: string;
  name: string;
  seedItemId: string;
  seedPrice: number;
  sellPrice: number;
  growthDays: number;
  /** Which seasons this crop can grow in. */
  seasons: Season[];
  /** Whether the crop regrows after harvest without replanting. */
  regrow: boolean;
  /** Days between regrowth harvests (only if regrow = true). */
  regrowDays?: number;
}

export type CropStage = 'seed' | 'sprout' | 'growing' | 'mature' | 'dead';

export interface CropState {
  id: string; // unique instance id
  definitionId: string;
  plotKey: string; // "x,y" tile coordinate key
  planted: boolean;
  watered: boolean;
  growthProgress: number; // 0 to growthDays
  stage: CropStage;
  harvestable: boolean;
  /** Set to true if the crop died due to wrong season/no water. */
  dead: boolean;
}
