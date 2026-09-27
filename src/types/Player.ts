/**
 * Player domain types.
 */

import type { InventoryState } from './Item';

export enum Direction {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
}

export interface PlayerState {
  x: number;
  y: number;
  money: number;
  stamina: number;
  maxStamina: number;
  direction: Direction;
  inventory: InventoryState;
  activeToolSlot: number;
}

export const PLAYER_DEFAULT_MONEY = 500;
export const PLAYER_DEFAULT_STAMINA = 100;
export const PLAYER_MAX_INVENTORY_SLOTS = 30;
