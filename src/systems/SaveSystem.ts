/**
 * SaveSystem — centralized save/load using localStorage.
 *
 * All save/load operations go through here. The underlying storage
 * mechanism can be swapped (IndexedDB, cloud) without changing any
 * other game system.
 */

import type { GameState } from '../types/GameState';
import { gameEvents } from '../managers/EventManager';

const SAVE_KEY = 'farmlife_save_v1';
export const SAVE_VERSION = '1.0.0';

export class SaveSystem {
  private static instance: SaveSystem;

  private constructor() {}

  static getInstance(): SaveSystem {
    if (!SaveSystem.instance) {
      SaveSystem.instance = new SaveSystem();
    }
    return SaveSystem.instance;
  }

  /** Returns true if a save file exists. */
  exists(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  /**
   * Save the game state.
   * @returns true on success
   */
  save(state: GameState): boolean {
    try {
      const serialized = JSON.stringify({ ...state, version: SAVE_VERSION });
      localStorage.setItem(SAVE_KEY, serialized);
      gameEvents.emit('GAME_SAVED');
      return true;
    } catch (err) {
      console.error('SaveSystem: Failed to save game', err);
      return false;
    }
  }

  /**
   * Load the game state.
   * @returns the saved GameState or null if no save exists
   */
  load(): GameState | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw) as GameState;

      // Version check — add migration logic here in the future
      if (!parsed.version) {
        console.warn('SaveSystem: Save file has no version; may be incompatible.');
      }

      gameEvents.emit('GAME_LOADED');
      return parsed;
    } catch (err) {
      console.error('SaveSystem: Failed to load game', err);
      return null;
    }
  }

  /** Delete the save file. */
  deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }
}

export const saveSystem = SaveSystem.getInstance();
