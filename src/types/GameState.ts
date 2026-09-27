/**
 * Central GameState type — the single source of truth for all game data.
 * Phaser sprites/objects should REPRESENT this state, not own it.
 */

import type { GameTime } from './GameTime';
import type { PlayerState } from './Player';
import type { CropState } from './Crop';

export type Weather = 'sunny' | 'rainy' | 'cloudy' | 'snowy' | 'windy';

export interface FarmPlotData {
  /** "x,y" tile coordinate key */
  key: string;
  tilled: boolean;
  watered: boolean;
  cropId?: string; // references CropState.id
}

export interface FarmState {
  plots: Record<string, FarmPlotData>;
  crops: Record<string, CropState>;
}

export interface GameState {
  version: string; // save format version for migration
  time: GameTime;
  player: PlayerState;
  weather: Weather;
  farm: FarmState;
}
