/**
 * Interactable interface — the contract all interactable game objects must implement.
 * This keeps interaction logic decoupled from the Player.
 */

export interface Interactable {
  /** Called when the player presses the interact key while facing this object. */
  interact(playerId?: string): void;
  /** Human-readable prompt shown in the UI when the player is nearby. */
  interactionLabel: string;
  /** Whether this object is currently interactable. */
  isInteractable: boolean;
}

/**
 * Marker interface for scene objects that can register as interactables.
 */
export interface InteractableEntity extends Interactable {
  /** Tile coordinates for proximity checking. */
  tileX: number;
  tileY: number;
}
