/**
 * Crop definitions — data-driven.
 * Adding a new crop = adding an entry here. No engine changes required.
 */

import { Season } from '../../types/GameTime';
import type { CropDefinition } from '../../types/Crop';

export const CROP_DEFINITIONS: Readonly<Record<string, CropDefinition>> = {
  turnip: {
    id: 'turnip',
    name: 'Turnip',
    seedItemId: 'turnip_seed',
    seedPrice: 60,
    sellPrice: 60,
    growthDays: 5,
    seasons: [Season.SPRING],
    regrow: false,
  },
  potato: {
    id: 'potato',
    name: 'Potato',
    seedItemId: 'potato_seed',
    seedPrice: 80,
    sellPrice: 80,
    growthDays: 8,
    seasons: [Season.SPRING],
    regrow: false,
  },
  tomato: {
    id: 'tomato',
    name: 'Tomato',
    seedItemId: 'tomato_seed',
    seedPrice: 50,
    sellPrice: 60,
    growthDays: 11,
    seasons: [Season.SUMMER],
    regrow: true,
    regrowDays: 4,
  },
};

export function getCropDefinition(id: string): CropDefinition | undefined {
  return CROP_DEFINITIONS[id];
}

export function getCropBySeedItemId(seedItemId: string): CropDefinition | undefined {
  return Object.values(CROP_DEFINITIONS).find((c) => c.seedItemId === seedItemId);
}
