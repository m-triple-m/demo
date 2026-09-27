/**
 * MapBuilder — creates Phaser tilemaps procedurally.
 *
 * Since we don't have Tiled .json files yet, we build maps directly in code
 * using the same tile IDs that a Tiled export would use.
 * The architecture is Tiled-compatible: when real maps are ready,
 * swap the scene.make.tilemap({ key: 'farm_map' }) calls.
 *
 * Tile IDs match the keys used in AssetGenerator:
 *   0 = empty/transparent
 *   1 = grass
 *   2 = soil (dry)
 *   3 = path/sand
 *   4 = water
 *   5 = stone
 *   6 = wood floor
 *   7 = wall
 *   8 = roof
 *   9 = fence
 */

import type Phaser from 'phaser';
import { TILE_SIZE } from '../config/gameConfig';

export const TILE_IDS = {
  EMPTY: 0,
  GRASS: 1,
  SOIL: 2,
  PATH: 3,
  WATER: 4,
  STONE: 5,
  WOOD_FLOOR: 6,
  WALL: 7,
  ROOF: 8,
  FENCE: 9,
} as const;

export type TileId = (typeof TILE_IDS)[keyof typeof TILE_IDS];

const TILE_TEXTURE_MAP: Record<number, string> = {
  [TILE_IDS.GRASS]: 'tile_grass',
  [TILE_IDS.SOIL]: 'tile_soil',
  [TILE_IDS.PATH]: 'tile_path',
  [TILE_IDS.WATER]: 'tile_water',
  [TILE_IDS.STONE]: 'tile_stone',
  [TILE_IDS.WOOD_FLOOR]: 'tile_wood_floor',
  [TILE_IDS.WALL]: 'tile_wall',
  [TILE_IDS.ROOF]: 'tile_roof',
  [TILE_IDS.FENCE]: 'tile_fence',
};

// ─── Farm Map (20×15 tiles) ──────────────────────────────────────────────────

// prettier-ignore
export const FARM_GROUND_LAYER: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,7,7,7,7,7,7,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,7,6,6,6,6,7,1,1,1,4,4,4,4,1,1,1,1,1],
  [1,1,7,6,6,6,6,7,1,1,1,4,4,4,4,1,1,1,1,1],
  [1,1,7,7,7,3,7,7,1,1,1,4,4,4,4,1,1,1,1,1],
  [1,1,1,1,1,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,2,2,2,3,2,2,2,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,2,2,2,3,2,2,2,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,2,2,2,3,2,2,2,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,3,3,3,3,3,3,3,3,3,3,3,3,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

/** Tiles in the collision/object layer that block movement (value > 0 = blocked). */
// prettier-ignore
export const FARM_COLLISION_LAYER: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // top border
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,0,0,0,0,1,0,0,0,1,1,1,1,0,0,0,0,1],
  [1,0,1,0,0,0,0,1,0,0,0,1,1,1,1,0,0,0,0,1],
  [1,0,1,1,1,0,1,1,0,0,0,1,1,1,1,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // bottom border
];

// ─── Town Map (20×15 tiles) ──────────────────────────────────────────────────

// prettier-ignore
export const TOWN_GROUND_LAYER: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,7,7,7,7,7,7,7,7,1,1,1,7,7,7,7,7,1,1],
  [1,1,7,6,6,6,6,6,6,7,1,1,1,7,6,6,6,7,1,1],
  [1,1,7,6,6,6,6,6,6,7,1,1,1,7,6,6,6,7,1,1],
  [1,1,7,6,6,6,6,6,6,7,1,1,1,7,6,6,6,7,1,1],
  [1,1,7,7,7,3,7,7,7,7,1,1,1,7,7,3,7,7,1,1],
  [1,1,1,1,1,3,1,1,1,1,1,1,1,1,1,3,1,1,1,1],
  [1,1,1,1,1,3,3,3,3,3,3,3,3,3,3,3,3,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// prettier-ignore
export const TOWN_COLLISION_LAYER: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,0,1],
  [1,0,1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,1],
  [1,0,1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,1],
  [1,0,1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,1],
  [1,0,1,1,1,0,1,1,1,1,0,0,0,1,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// ─── Interactable object positions ───────────────────────────────────────────

export interface MapObjectDef {
  type: 'house' | 'shop' | 'tree' | 'sign' | 'shipping_box' | 'npc' | 'door';
  tileX: number;
  tileY: number;
  /** Destination when this is a door */
  destination?: { map: string; spawnX: number; spawnY: number };
  /** NPC id for 'npc' type */
  npcId?: string;
  /** Dialogue id for signs/npcs */
  dialogueId?: string;
  label?: string;
}

export const FARM_OBJECTS: MapObjectDef[] = [
  { type: 'house', tileX: 2, tileY: 2, label: 'Your House' },
  {
    type: 'door',
    tileX: 5,
    tileY: 5,
    label: 'Enter House',
    // Transitions to town — the house interior doesn't exist yet,
    // so we teleport to the town map and back is handled from there.
    // Spawn at tile (5,7) — the open path just below the store doorway in town.
    destination: { map: 'town', spawnX: 5, spawnY: 7 },
  },
  {
    type: 'door',
    tileX: 9,
    tileY: 13,
    label: 'Go to Town',
    destination: { map: 'town', spawnX: 5, spawnY: 13 },
  },
  { type: 'tree', tileX: 16, tileY: 2 },
  { type: 'tree', tileX: 17, tileY: 4 },
  { type: 'tree', tileX: 15, tileY: 6 },
  { type: 'tree', tileX: 18, tileY: 7 },
  { type: 'shipping_box', tileX: 10, tileY: 7, label: 'Shipping Box' },
  { type: 'sign', tileX: 8, tileY: 13, label: 'Read Sign', dialogueId: 'sign_farm_entrance' },
];

export const TOWN_OBJECTS: MapObjectDef[] = [
  { type: 'shop', tileX: 2, tileY: 2, label: "Ellen's Store" },
  { type: 'house', tileX: 13, tileY: 2, label: "Mayor's House" },
  {
    type: 'door',
    tileX: 5,
    tileY: 6,
    label: 'Enter Store',
    // No interior scene yet — spawn just outside the door on the open path tile
    destination: { map: 'town', spawnX: 5, spawnY: 7 },
  },
  {
    type: 'door',
    tileX: 15,
    tileY: 6,
    label: "Enter Mayor's House",
    destination: { map: 'town', spawnX: 15, spawnY: 7 },
  },
  {
    type: 'door',
    tileX: 5,
    tileY: 13,
    label: 'Go to Farm',
    destination: { map: 'farm', spawnX: 9, spawnY: 12 },
  },
  { type: 'npc', tileX: 4, tileY: 5, npcId: 'shopkeeper', dialogueId: 'shopkeeper_greeting', label: 'Talk to Ellen' },
  { type: 'npc', tileX: 15, tileY: 5, npcId: 'mayor', dialogueId: 'mayor_greeting', label: 'Talk to Mayor Thomas' },
  { type: 'tree', tileX: 17, tileY: 3 },
  { type: 'tree', tileX: 18, tileY: 6 },
];

// ─── Farm plot positions (tilled farm field area) ────────────────────────────

/** Returns all tile coordinates that can be used as farm plots. */
export function getFarmPlotCoords(): Array<{ x: number; y: number }> {
  const plots: Array<{ x: number; y: number }> = [];
  for (let ty = 7; ty <= 9; ty++) {
    for (let tx = 2; tx <= 8; tx++) {
      // Skip center path
      if (tx === 5) continue;
      const row = FARM_GROUND_LAYER[ty];
      if (row && row[tx] === TILE_IDS.SOIL) {
        plots.push({ x: tx, y: ty });
      }
    }
  }
  return plots;
}

// ─── Map builder function ─────────────────────────────────────────────────────

/**
 * Build a tilemap layer from a 2D number array.
 * Returns an array of Phaser Image sprites representing tiles.
 */
export function buildTileLayer(
  scene: Phaser.Scene,
  layerData: number[][],
  depthOffset = 0
): Phaser.GameObjects.Image[] {
  const images: Phaser.GameObjects.Image[] = [];
  for (let row = 0; row < layerData.length; row++) {
    const rowData = layerData[row];
    if (!rowData) continue;
    for (let col = 0; col < rowData.length; col++) {
      const tileId = rowData[col];
      if (tileId === undefined || tileId === TILE_IDS.EMPTY) continue;
      const textureKey = TILE_TEXTURE_MAP[tileId];
      if (!textureKey) continue;
      const img = scene.add.image(
        col * TILE_SIZE + TILE_SIZE / 2,
        row * TILE_SIZE + TILE_SIZE / 2,
        textureKey
      );
      img.setDepth(depthOffset);
      images.push(img);
    }
  }
  return images;
}

/**
 * Build a static-body physics group from a collision layer.
 * Tiles with value > 0 become solid.
 */
export function buildCollisionLayer(
  scene: Phaser.Scene,
  layerData: number[][]
): Phaser.Physics.Arcade.StaticGroup {
  const group = scene.physics.add.staticGroup();
  for (let row = 0; row < layerData.length; row++) {
    const rowData = layerData[row];
    if (!rowData) continue;
    for (let col = 0; col < rowData.length; col++) {
      const val = rowData[col];
      if (!val) continue;
      // Use an invisible rect as the collider
      const rect = scene.add.rectangle(
        col * TILE_SIZE + TILE_SIZE / 2,
        row * TILE_SIZE + TILE_SIZE / 2,
        TILE_SIZE,
        TILE_SIZE
      );
      rect.setVisible(false);
      scene.physics.add.existing(rect, true);
      group.add(rect);
    }
  }
  return group;
}
