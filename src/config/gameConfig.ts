/**
 * Game configuration — Phaser game config and global constants.
 *
 * Internal resolution: 640×360 (16:9, 2× the original 320×180).
 * The camera runs at 2× zoom so the world tiles feel the same GBA scale,
 * but text and UI are rendered at double the pixel density — sharp on any screen.
 */

export const GAME_WIDTH = 640;
export const GAME_HEIGHT = 360;

/**
 * Camera zoom factor. All world coordinates stay in 16-px tile units;
 * the camera scales them up visually by this factor.
 */
export const CAMERA_ZOOM = 2;

/** Tile size in pixels (world-space, unzoomed). */
export const TILE_SIZE = 16;

/** Map dimensions in tiles. */
export const FARM_MAP_WIDTH = 20;
export const FARM_MAP_HEIGHT = 15;
export const TOWN_MAP_WIDTH = 20;
export const TOWN_MAP_HEIGHT = 15;

/** Player movement speed in pixels per second (world-space). */
export const PLAYER_SPEED = 80;

/** How often the game auto-saves (in ms). */
export const AUTO_SAVE_INTERVAL_MS = 60_000;

/** Scene keys — defined once to avoid typo bugs. */
export const SCENE_KEYS = {
  BOOT: 'BootScene',
  PRELOAD: 'PreloadScene',
  MAIN_MENU: 'MainMenuScene',
  GAME: 'GameScene',
  UI: 'UIScene',
} as const;

export type SceneKey = (typeof SCENE_KEYS)[keyof typeof SCENE_KEYS];

/** Map keys */
export const MAP_KEYS = {
  FARM: 'farm',
  TOWN: 'town',
} as const;

export type MapKey = (typeof MAP_KEYS)[keyof typeof MAP_KEYS];
