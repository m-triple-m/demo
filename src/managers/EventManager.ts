/**
 * EventManager — a lightweight type-safe event bus.
 *
 * All game systems communicate through events rather than direct references.
 * This keeps systems decoupled and makes it easy to add new listeners later
 * (e.g., quests, achievements, audio triggers).
 */

// All possible game events and their payload types
export interface GameEventMap {
  DAY_STARTED: { day: number; season: string; year: number };
  DAY_ENDED: { day: number; season: string; year: number };
  TIME_CHANGED: { hour: number; minute: number };
  SEASON_CHANGED: { season: string };
  YEAR_CHANGED: { year: number };

  CROP_PLANTED: { plotKey: string; cropId: string; definitionId: string };
  CROP_WATERED: { plotKey: string; cropId: string };
  CROP_GROWN: { plotKey: string; cropId: string; definitionId: string };
  CROP_HARVESTED: { plotKey: string; cropId: string; definitionId: string };
  CROP_DIED: { plotKey: string; cropId: string };

  SOIL_TILLED: { plotKey: string };

  ITEM_ADDED: { itemId: string; quantity: number };
  ITEM_REMOVED: { itemId: string; quantity: number };

  PLAYER_MONEY_CHANGED: { amount: number; newTotal: number };
  PLAYER_STAMINA_CHANGED: { amount: number; newTotal: number };

  SCENE_TRANSITION: { from: string; to: string };
  INTERACTION_STARTED: { label: string };
  INTERACTION_ENDED: void;

  GAME_SAVED: void;
  GAME_LOADED: void;
}

type EventPayload<K extends keyof GameEventMap> =
  GameEventMap[K] extends void ? [] : [GameEventMap[K]];

type Listener<K extends keyof GameEventMap> = (
  ...args: EventPayload<K>
) => void;

export class EventManager {
  private static instance: EventManager;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  private constructor() {}

  static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  on<K extends keyof GameEventMap>(event: K, listener: Listener<K>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as (...args: unknown[]) => void);
  }

  off<K extends keyof GameEventMap>(event: K, listener: Listener<K>): void {
    this.listeners.get(event)?.delete(listener as (...args: unknown[]) => void);
  }

  emit<K extends keyof GameEventMap>(event: K, ...args: EventPayload<K>): void {
    this.listeners.get(event)?.forEach((listener) => {
      listener(...args);
    });
  }

  /** Remove all listeners for an event (useful when destroying scenes). */
  removeAllListeners(event?: keyof GameEventMap): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

/** Convenience singleton accessor */
export const gameEvents = EventManager.getInstance();
