/**
 * AssetGenerator — creates procedural pixel-art textures at runtime.
 *
 * Since we don't have actual sprite sheets yet, we generate colored rectangles
 * and simple pixel patterns that give the game a coherent retro look.
 * Replace with real sprite sheets when artwork is ready.
 */

import type Phaser from 'phaser';

const C = {
  // Terrain
  GRASS: 0x5a8a3a,
  GRASS_DARK: 0x4a7a2a,
  SOIL_DRY: 0x8b6914,
  SOIL_TILLED: 0x6b4a10,
  SOIL_WATERED: 0x4a3008,
  WATER: 0x3060c0,
  WATER_LIGHT: 0x5080e0,
  SAND: 0xc8a060,
  STONE: 0x888888,
  STONE_DARK: 0x666666,
  WOOD: 0x9b6a34,
  WOOD_DARK: 0x7b4a14,
  ROOF: 0xc04040,
  ROOF_DARK: 0x902020,

  // Vegetation
  TREE_TRUNK: 0x6b4010,
  TREE_LEAVES: 0x2a7a20,
  TREE_LEAVES2: 0x1a5a10,
  CROP_SEED: 0xc8a060,
  CROP_SPROUT: 0x80c040,
  CROP_GROWING: 0x40a020,
  CROP_MATURE: 0xffc020,

  // Player
  PLAYER_BODY: 0xe0a060,
  PLAYER_HAIR: 0x602010,
  PLAYER_SHIRT: 0x3060c0,
  PLAYER_PANTS: 0x304080,
  PLAYER_SHOES: 0x402000,

  // NPC
  NPC_BODY: 0xe0c090,
  NPC_HAIR: 0x804020,
  NPC_OUTFIT: 0x806040,

  // UI
  UI_BG: 0x000000,
  UI_BORDER: 0xffffff,
  UI_TEXT: 0xffffff,

  // Misc
  WHITE: 0xffffff,
  BLACK: 0x000000,
  TRANSPARENT: 0,
} as const;

function px(
  gfx: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number,
  alpha = 1
): void {
  gfx.fillStyle(color, alpha);
  gfx.fillRect(x, y, w, h);
}

export function generateAssets(scene: Phaser.Scene): void {
  generateTileTextures(scene);
  generatePlayerTexture(scene);
  generateNPCTextures(scene);
  generateCropTextures(scene);
  generateItemTextures(scene);
  generateUITextures(scene);
  generateInteractableTextures(scene);
}

// ─── Tiles ────────────────────────────────────────────────────────────────────

function generateTileTextures(scene: Phaser.Scene): void {
  const tiles: Array<{ key: string; drawFn: (g: Phaser.GameObjects.Graphics) => void }> = [
    {
      key: 'tile_grass',
      drawFn: (g) => {
        px(g, 0, 0, 16, 16, C.GRASS);
        // Subtle texture variation
        px(g, 3, 5, 1, 2, C.GRASS_DARK, 0.5);
        px(g, 9, 2, 1, 2, C.GRASS_DARK, 0.5);
        px(g, 13, 10, 1, 2, C.GRASS_DARK, 0.5);
        px(g, 6, 12, 1, 1, C.GRASS_DARK, 0.5);
      },
    },
    {
      key: 'tile_soil',
      drawFn: (g) => {
        px(g, 0, 0, 16, 16, C.SOIL_DRY);
        px(g, 2, 3, 2, 1, C.SOIL_TILLED, 0.4);
        px(g, 8, 7, 2, 1, C.SOIL_TILLED, 0.4);
        px(g, 4, 12, 2, 1, C.SOIL_TILLED, 0.4);
      },
    },
    {
      key: 'tile_soil_tilled',
      drawFn: (g) => {
        px(g, 0, 0, 16, 16, C.SOIL_TILLED);
        // Furrow lines
        for (let row = 2; row < 16; row += 4) {
          px(g, 0, row, 16, 2, C.SOIL_DRY, 0.3);
        }
      },
    },
    {
      key: 'tile_soil_watered',
      drawFn: (g) => {
        px(g, 0, 0, 16, 16, C.SOIL_WATERED);
        for (let row = 2; row < 16; row += 4) {
          px(g, 0, row, 16, 2, C.SOIL_TILLED, 0.4);
        }
        // Water sheen
        px(g, 0, 0, 16, 1, 0x6090ff, 0.15);
      },
    },
    {
      key: 'tile_water',
      drawFn: (g) => {
        px(g, 0, 0, 16, 16, C.WATER);
        // Ripple lines
        px(g, 2, 4, 5, 1, C.WATER_LIGHT, 0.5);
        px(g, 9, 8, 4, 1, C.WATER_LIGHT, 0.5);
        px(g, 3, 12, 6, 1, C.WATER_LIGHT, 0.5);
      },
    },
    {
      key: 'tile_path',
      drawFn: (g) => {
        px(g, 0, 0, 16, 16, C.SAND);
        px(g, 0, 0, 16, 1, 0xd0b070, 0.5);
        px(g, 0, 15, 16, 1, 0xa08050, 0.5);
        px(g, 4, 6, 3, 2, C.STONE, 0.2);
        px(g, 10, 10, 2, 2, C.STONE, 0.2);
      },
    },
    {
      key: 'tile_stone',
      drawFn: (g) => {
        px(g, 0, 0, 16, 16, C.STONE);
        px(g, 0, 0, 16, 1, C.WHITE, 0.1);
        px(g, 0, 15, 16, 1, C.BLACK, 0.2);
        px(g, 7, 0, 1, 16, C.STONE_DARK, 0.3);
      },
    },
    {
      key: 'tile_wood_floor',
      drawFn: (g) => {
        px(g, 0, 0, 16, 16, C.WOOD);
        px(g, 0, 0, 16, 1, C.WOOD_DARK, 0.3);
        px(g, 0, 8, 16, 1, C.WOOD_DARK, 0.3);
        px(g, 0, 15, 16, 1, C.WOOD_DARK, 0.5);
      },
    },
    {
      key: 'tile_wall',
      drawFn: (g) => {
        px(g, 0, 0, 16, 16, 0xc8b080);
        // Brick pattern
        for (let row = 0; row < 16; row += 4) {
          const offset = (row / 4) % 2 === 0 ? 0 : 8;
          for (let col = offset; col < 24; col += 16) {
            px(g, col - 1, row, 1, 4, 0xa09060, 0.6);
          }
          px(g, 0, row + 3, 16, 1, 0xa09060, 0.4);
        }
      },
    },
    {
      key: 'tile_roof',
      drawFn: (g) => {
        px(g, 0, 0, 16, 16, C.ROOF);
        // Shingle pattern
        for (let row = 0; row < 16; row += 4) {
          px(g, 0, row, 16, 1, C.ROOF_DARK, 0.5);
          for (let col = 0; col < 16; col += 8) {
            px(g, col + 3, row + 1, 1, 3, C.ROOF_DARK, 0.3);
          }
        }
      },
    },
    {
      key: 'tile_fence',
      drawFn: (g) => {
        px(g, 0, 0, 16, 16, C.TRANSPARENT);
        // Fence post
        px(g, 6, 0, 4, 16, C.WOOD);
        px(g, 7, 0, 2, 16, C.WOOD_DARK, 0.3);
        // Horizontal rails
        px(g, 0, 3, 16, 2, C.WOOD);
        px(g, 0, 10, 16, 2, C.WOOD);
      },
    },
  ];

  for (const { key, drawFn } of tiles) {
    const g = scene.add.graphics();
    drawFn(g);
    g.generateTexture(key, 16, 16);
    g.destroy();
  }
}

// ─── Player ──────────────────────────────────────────────────────────────────

/**
 * Generate individual named textures for each player direction + frame.
 * Naming: player_down_idle, player_down_walk1, player_down_walk2, etc.
 * This avoids spritesheet frame-index issues with programmatic textures.
 */
function generatePlayerTexture(scene: Phaser.Scene): void {
  const dirs = ['down', 'left', 'right', 'up'] as const;
  const frames = ['idle', 'walk1', 'walk2'] as const;

  for (let dirIdx = 0; dirIdx < dirs.length; dirIdx++) {
    for (let frameIdx = 0; frameIdx < frames.length; frameIdx++) {
      const key = `player_${dirs[dirIdx]}_${frames[frameIdx]}`;
      const g = scene.add.graphics();
      drawPlayerFrame(g, 0, 0, dirIdx, frameIdx);
      g.generateTexture(key, 16, 16);
      g.destroy();
    }
  }

  // Default 'player' texture (down idle) as initial frame
  const g = scene.add.graphics();
  drawPlayerFrame(g, 0, 0, 0, 0);
  g.generateTexture('player', 16, 16);
  g.destroy();
}


function drawPlayerFrame(
  g: Phaser.GameObjects.Graphics,
  ox: number,
  oy: number,
  dir: number,
  frame: number
): void {
  // Legs bobbing
  const legOff = frame === 1 ? -1 : frame === 2 ? 1 : 0;
  const facing = dir; // 0=down,1=left,2=right,3=up

  // Body (shirt)
  px(g, ox + 4, oy + 7, 8, 6, C.PLAYER_SHIRT);
  // Skin (face/arms)
  px(g, ox + 5, oy + 2, 6, 5, C.PLAYER_BODY);
  // Hair
  px(g, ox + 4, oy + 2, 8, 2, C.PLAYER_HAIR);
  // Pants
  px(g, ox + 4, oy + 13 + (legOff > 0 ? 0 : 0), 8, 3, C.PLAYER_PANTS);
  // Shoes
  px(g, ox + 4, oy + 14, 3, 2, C.PLAYER_SHOES);
  px(g, ox + 9, oy + 14, 3, 2, C.PLAYER_SHOES);

  // Eyes based on direction
  if (facing === 0) {
    // Down — face visible
    px(g, ox + 6, oy + 5, 1, 1, 0x302010);
    px(g, ox + 9, oy + 5, 1, 1, 0x302010);
  } else if (facing === 1) {
    // Left
    px(g, ox + 5, oy + 5, 1, 1, 0x302010);
  } else if (facing === 2) {
    // Right
    px(g, ox + 10, oy + 5, 1, 1, 0x302010);
  }
  // Up — back of head, no eyes

  // Walking leg animation
  if (frame === 1) {
    px(g, ox + 4, oy + 13, 3, 3, C.PLAYER_PANTS);
    px(g, ox + 9, oy + 14, 3, 2, C.PLAYER_PANTS);
  } else if (frame === 2) {
    px(g, ox + 9, oy + 13, 3, 3, C.PLAYER_PANTS);
    px(g, ox + 4, oy + 14, 3, 2, C.PLAYER_PANTS);
  }
}

// ─── NPCs ─────────────────────────────────────────────────────────────────────

function generateNPCTextures(scene: Phaser.Scene): void {
  // Simple NPC placeholder — single standing sprite
  const g = scene.add.graphics();
  // Body
  px(g, 4, 7, 8, 6, C.NPC_OUTFIT);
  // Skin
  px(g, 5, 2, 6, 5, C.NPC_BODY);
  // Hair
  px(g, 4, 1, 8, 3, C.NPC_HAIR);
  // Legs
  px(g, 4, 13, 8, 3, 0x604020);
  g.generateTexture('npc_default', 16, 16);
  g.destroy();
}

// ─── Crops ───────────────────────────────────────────────────────────────────

function generateCropTextures(scene: Phaser.Scene): void {
  const stages: Array<{
    key: string;
    drawFn: (g: Phaser.GameObjects.Graphics) => void;
  }> = [
    {
      key: 'crop_seed',
      drawFn: (g) => {
        px(g, 6, 10, 4, 3, C.CROP_SEED);
        px(g, 7, 8, 2, 2, C.CROP_SEED, 0.7);
      },
    },
    {
      key: 'crop_sprout',
      drawFn: (g) => {
        px(g, 7, 6, 2, 8, C.CROP_SPROUT);
        px(g, 5, 6, 4, 2, C.CROP_SPROUT);
        px(g, 9, 7, 3, 2, C.CROP_SPROUT);
      },
    },
    {
      key: 'crop_growing',
      drawFn: (g) => {
        // Stem
        px(g, 7, 4, 2, 11, C.CROP_GROWING);
        // Leaves
        px(g, 3, 5, 5, 2, C.CROP_GROWING);
        px(g, 8, 7, 5, 2, C.TREE_LEAVES2);
        px(g, 4, 9, 4, 2, C.TREE_LEAVES2);
      },
    },
    {
      key: 'crop_mature',
      drawFn: (g) => {
        // Stem
        px(g, 7, 3, 2, 12, C.CROP_GROWING);
        // Leaves
        px(g, 3, 4, 5, 2, C.CROP_GROWING);
        px(g, 8, 6, 5, 2, C.TREE_LEAVES2);
        // Fruit/vegetable (bright highlight)
        px(g, 5, 3, 4, 4, C.CROP_MATURE);
        px(g, 6, 2, 2, 2, C.CROP_MATURE);
        px(g, 9, 5, 3, 3, 0xff8020, 0.8);
      },
    },
    {
      key: 'crop_dead',
      drawFn: (g) => {
        px(g, 6, 8, 4, 6, 0x806040, 0.6);
        px(g, 5, 6, 6, 3, 0x806040, 0.4);
      },
    },
  ];

  for (const { key, drawFn } of stages) {
    const g = scene.add.graphics();
    drawFn(g);
    g.generateTexture(key, 16, 16);
    g.destroy();
  }
}

// ─── Items & Tools ──────────────────────────────────────────────────────────

function generateItemTextures(scene: Phaser.Scene): void {
  const items: Array<{
    key: string;
    drawFn: (g: Phaser.GameObjects.Graphics) => void;
  }> = [
    {
      key: 'icon_hoe',
      drawFn: (g) => {
        // Wood handle
        px(g, 4, 11, 2, 2, 0x8b5a2b);
        px(g, 6, 9, 2, 2, 0x8b5a2b);
        px(g, 8, 7, 2, 2, 0x8b5a2b);
        px(g, 10, 5, 2, 2, 0x8b5a2b);
        // Iron head
        px(g, 10, 2, 4, 3, 0xcccccc);
        px(g, 13, 3, 2, 4, 0x999999);
      },
    },
    {
      key: 'icon_watering_can',
      drawFn: (g) => {
        // Can body
        px(g, 4, 6, 8, 7, 0x3a7bd5);
        px(g, 5, 7, 6, 5, 0x64b5f6);
        // Spout
        px(g, 11, 8, 3, 2, 0x2962ff);
        px(g, 13, 7, 2, 3, 0x1565c0);
        // Handle
        px(g, 2, 4, 3, 2, 0x1565c0);
        px(g, 2, 6, 2, 4, 0x1565c0);
        // Top cap
        px(g, 6, 4, 4, 2, 0x1565c0);
      },
    },
    {
      key: 'icon_turnip_seed',
      drawFn: (g) => {
        // Pouch
        px(g, 3, 3, 10, 10, 0xd4a373);
        px(g, 4, 4, 8, 8, 0xfaedcd);
        // Pouch string
        px(g, 5, 2, 6, 2, 0xbc6c25);
        // Green sprout symbol
        px(g, 7, 6, 2, 4, 0x2d6a4f);
        px(g, 5, 6, 3, 2, 0x52b788);
        px(g, 8, 5, 3, 2, 0x74c69d);
      },
    },
    {
      key: 'icon_potato_seed',
      drawFn: (g) => {
        // Pouch
        px(g, 3, 3, 10, 10, 0xbc6c25);
        px(g, 4, 4, 8, 8, 0xdda15e);
        // String
        px(g, 5, 2, 6, 2, 0x8b4513);
        // Tuber symbol
        px(g, 6, 6, 4, 4, 0x936639);
        px(g, 7, 7, 2, 2, 0xc6ac8f);
      },
    },
    {
      key: 'icon_tomato_seed',
      drawFn: (g) => {
        // Pouch
        px(g, 3, 3, 10, 10, 0x9b2226);
        px(g, 4, 4, 8, 8, 0xe76f51);
        // String
        px(g, 5, 2, 6, 2, 0x6b1d2f);
        // Red fruit symbol
        px(g, 6, 6, 4, 4, 0xd90429);
        px(g, 7, 5, 2, 2, 0x2b9348);
      },
    },
    {
      key: 'icon_turnip',
      drawFn: (g) => {
        // Leaves
        px(g, 6, 2, 2, 3, 0x2d6a4f);
        px(g, 4, 3, 3, 2, 0x52b788);
        px(g, 8, 3, 4, 2, 0x74c69d);
        // Bulb
        px(g, 4, 5, 8, 8, 0xf8edeb);
        px(g, 5, 12, 6, 2, 0xfcd5ce);
        px(g, 7, 13, 2, 2, 0xe8e8e4);
        // Purple tint on top
        px(g, 4, 5, 8, 3, 0xb5838d);
      },
    },
    {
      key: 'icon_potato',
      drawFn: (g) => {
        // Potato body
        px(g, 3, 4, 10, 8, 0xb08968);
        px(g, 4, 3, 8, 10, 0x9c6644);
        px(g, 4, 5, 8, 6, 0xddb892);
        // Eyes/dots
        px(g, 5, 6, 2, 1, 0x7f4f24);
        px(g, 9, 8, 2, 1, 0x7f4f24);
        px(g, 6, 9, 1, 1, 0x7f4f24);
      },
    },
    {
      key: 'icon_tomato',
      drawFn: (g) => {
        // Calyx / Stem
        px(g, 7, 2, 2, 3, 0x2b9348);
        px(g, 5, 3, 6, 2, 0x55a630);
        // Fruit body
        px(g, 3, 4, 10, 9, 0xd90429);
        px(g, 4, 3, 8, 11, 0xd90429);
        // Highlight
        px(g, 5, 5, 3, 3, 0xff758f);
        // Shade
        px(g, 4, 11, 8, 2, 0x9b2226);
      },
    },
  ];

  for (const { key, drawFn } of items) {
    const g = scene.add.graphics();
    drawFn(g);
    g.generateTexture(key, 16, 16);
    g.destroy();
  }
}

// ─── UI Textures ──────────────────────────────────────────────────────────────

function generateUITextures(scene: Phaser.Scene): void {
  // Dialogue box  (440×96 — 2× the old 220×48)
  const dlg = scene.add.graphics();
  dlg.fillStyle(0x0a0a1a, 0.92);
  dlg.fillRoundedRect(0, 0, 440, 96, 6);
  dlg.lineStyle(2, 0x8888cc, 0.9);
  dlg.strokeRoundedRect(0, 0, 440, 96, 6);
  dlg.generateTexture('dialogue_box', 440, 96);
  dlg.destroy();

  // Hotbar slot  (36×36 — 2× the old 18×18)
  const slot = scene.add.graphics();
  slot.fillStyle(0x1a1a2e, 0.85);
  slot.fillRect(0, 0, 36, 36);
  slot.lineStyle(2, 0x4444aa, 0.9);
  slot.strokeRect(0, 0, 36, 36);
  slot.generateTexture('hotbar_slot', 36, 36);
  slot.destroy();

  // Hotbar slot — active  (36×36)
  const slotActive = scene.add.graphics();
  slotActive.fillStyle(0x2a2a5e, 0.95);
  slotActive.fillRect(0, 0, 36, 36);
  slotActive.lineStyle(2, 0xaaaaff, 1);
  slotActive.strokeRect(0, 0, 36, 36);
  slotActive.generateTexture('hotbar_slot_active', 36, 36);
  slotActive.destroy();

  // HUD background bar (kept for backward compat)
  const hud = scene.add.graphics();
  hud.fillStyle(0x0a0a1a, 0.85);
  hud.fillRect(0, 0, 640, 36);
  hud.lineStyle(1, 0x333366, 0.8);
  hud.strokeRect(0, 0, 640, 36);
  hud.generateTexture('hud_bar', 640, 36);
  hud.destroy();

  // Compact HUD box for bottom-right corner (148×74)
  const hudBox = scene.add.graphics();
  hudBox.fillStyle(0x0d1322, 0.9);
  hudBox.fillRoundedRect(0, 0, 148, 74, 6);
  hudBox.lineStyle(2, 0x415a77, 0.95);
  hudBox.strokeRoundedRect(0, 0, 148, 74, 6);
  hudBox.lineStyle(1, 0x778da9, 0.4);
  hudBox.strokeRoundedRect(2, 2, 144, 70, 4);
  hudBox.generateTexture('hud_box', 148, 74);
  hudBox.destroy();

  // Full Inventory Modal Background (460×240)
  const invModal = scene.add.graphics();
  invModal.fillStyle(0x0a0e17, 0.96);
  invModal.fillRoundedRect(0, 0, 460, 240, 8);
  invModal.lineStyle(2, 0x5a6578, 1);
  invModal.strokeRoundedRect(0, 0, 460, 240, 8);
  invModal.lineStyle(1, 0x2e3848, 0.8);
  invModal.strokeRoundedRect(3, 3, 454, 234, 6);
  // Header bar area
  invModal.fillStyle(0x161d2d, 1);
  invModal.fillRoundedRect(4, 4, 452, 28, 4);
  invModal.generateTexture('inventory_modal_bg', 460, 240);
  invModal.destroy();

  // Inventory Slot (34×34)
  const invSlot = scene.add.graphics();
  invSlot.fillStyle(0x141b2b, 0.9);
  invSlot.fillRoundedRect(0, 0, 34, 34, 4);
  invSlot.lineStyle(1, 0x3d4a63, 0.9);
  invSlot.strokeRoundedRect(0, 0, 34, 34, 4);
  invSlot.generateTexture('inv_slot_bg', 34, 34);
  invSlot.destroy();

  // Inventory Slot Selected (34×34)
  const invSlotSel = scene.add.graphics();
  invSlotSel.fillStyle(0x23314d, 0.95);
  invSlotSel.fillRoundedRect(0, 0, 34, 34, 4);
  invSlotSel.lineStyle(2, 0xf4a261, 1);
  invSlotSel.strokeRoundedRect(0, 0, 34, 34, 4);
  invSlotSel.generateTexture('inv_slot_selected', 34, 34);
  invSlotSel.destroy();

  // Transition overlay  (640×360)
  const overlay = scene.add.graphics();
  overlay.fillStyle(0x000000, 1);
  overlay.fillRect(0, 0, 640, 360);
  overlay.generateTexture('black_overlay', 640, 360);
  overlay.destroy();

  // Interact prompt bg  (200×28 — 2× the old 100×14)
  const prompt = scene.add.graphics();
  prompt.fillStyle(0x1a1a2e, 0.9);
  prompt.fillRoundedRect(0, 0, 200, 28, 4);
  prompt.lineStyle(2, 0x6666cc, 0.8);
  prompt.strokeRoundedRect(0, 0, 200, 28, 4);
  prompt.generateTexture('interact_prompt', 200, 28);
  prompt.destroy();

  // Main menu background  (640×360)
  const menuBg = scene.add.graphics();
  menuBg.fillStyle(0x1a2a1a, 1);
  menuBg.fillRect(0, 0, 640, 360);
  // Rolling hills silhouette
  menuBg.fillStyle(0x2a4a1a, 1);
  menuBg.fillEllipse(120, 340, 240, 120);
  menuBg.fillEllipse(400, 350, 300, 110);
  menuBg.fillEllipse(620, 330, 200, 100);
  // Sky gradient
  menuBg.fillStyle(0x102040, 0.3);
  menuBg.fillRect(0, 0, 640, 180);
  menuBg.fillStyle(0x203050, 0.2);
  menuBg.fillRect(0, 0, 640, 100);
  // Stars (doubled positions, 2×2 pixels each)
  const starPositions = [
    [40, 20], [100, 60], [180, 30], [260, 50], [340, 16], [420, 40],
    [500, 70], [580, 24], [620, 80], [20, 90], [150, 100], [310, 84],
    [70, 140], [230, 120], [470, 50], [550, 130], [360, 110], [90, 170],
  ];
  menuBg.fillStyle(0xffffff, 0.9);
  for (const [sx, sy] of starPositions) {
    menuBg.fillRect(sx ?? 0, sy ?? 0, 2, 2);
  }
  menuBg.generateTexture('main_menu_bg', 640, 360);
  menuBg.destroy();

  // Menu button  (200×36 — 2× the old 120×20, slightly wider for longer labels)
  const btn = scene.add.graphics();
  btn.fillStyle(0x2a4a2a, 0.95);
  btn.fillRoundedRect(0, 0, 200, 36, 5);
  btn.lineStyle(2, 0x5a8a3a, 1);
  btn.strokeRoundedRect(0, 0, 200, 36, 5);
  btn.generateTexture('menu_button', 200, 36);
  btn.destroy();

  // Menu button — hover  (200×36)
  const btnHover = scene.add.graphics();
  btnHover.fillStyle(0x3a6a3a, 0.95);
  btnHover.fillRoundedRect(0, 0, 200, 36, 5);
  btnHover.lineStyle(2, 0x8aba5a, 1);
  btnHover.strokeRoundedRect(0, 0, 200, 36, 5);
  btnHover.generateTexture('menu_button_hover', 200, 36);
  btnHover.destroy();
}

// ─── Interactables ────────────────────────────────────────────────────────────

function generateInteractableTextures(scene: Phaser.Scene): void {
  // Tree (16×24, so taller than one tile)
  const tree = scene.add.graphics();
  // Trunk
  px(tree, 5, 16, 6, 8, C.TREE_TRUNK);
  px(tree, 7, 12, 2, 12, C.TREE_TRUNK);
  // Canopy
  px(tree, 2, 4, 12, 12, C.TREE_LEAVES);
  px(tree, 0, 8, 16, 8, C.TREE_LEAVES);
  px(tree, 3, 2, 10, 6, C.TREE_LEAVES2);
  px(tree, 5, 0, 6, 4, C.TREE_LEAVES2);
  // Highlight
  px(tree, 4, 4, 3, 3, 0x50b040, 0.4);
  tree.generateTexture('tree', 16, 24);
  tree.destroy();

  // House / player house (32×32)
  const house = scene.add.graphics();
  // Wall
  px(house, 0, 14, 32, 18, 0xd8c898);
  // Roof
  for (let i = 0; i < 14; i++) {
    px(house, i, i, 32 - i * 2, 1, C.ROOF);
  }
  px(house, 0, 13, 32, 2, C.ROOF_DARK, 0.5);
  // Door
  px(house, 12, 22, 8, 10, C.WOOD_DARK);
  px(house, 13, 23, 6, 9, 0x704010);
  px(house, 17, 27, 2, 2, 0xffd080); // door knob
  // Window
  px(house, 2, 18, 8, 6, 0x80c0ff, 0.6);
  px(house, 22, 18, 8, 6, 0x80c0ff, 0.6);
  px(house, 5, 18, 1, 6, C.WOOD, 0.5);
  px(house, 26, 18, 1, 6, C.WOOD, 0.5);
  house.generateTexture('house', 32, 32);
  house.destroy();

  // Shop building (32×32)
  const shop = scene.add.graphics();
  px(shop, 0, 14, 32, 18, 0xc8d0a0);
  // Blue roof
  for (let i = 0; i < 14; i++) {
    px(shop, i, i, 32 - i * 2, 1, 0x3060c0);
  }
  // Shop sign
  px(shop, 6, 16, 20, 5, 0xffd060);
  px(shop, 7, 17, 18, 3, 0xffb020);
  // Door
  px(shop, 12, 22, 8, 10, C.WOOD);
  // Windows
  px(shop, 2, 18, 7, 5, 0x80d0ff, 0.6);
  px(shop, 23, 18, 7, 5, 0x80d0ff, 0.6);
  shop.generateTexture('shop', 32, 32);
  shop.destroy();

  // Shipping box
  const box = scene.add.graphics();
  px(box, 1, 5, 14, 10, 0x8b6914);
  px(box, 0, 4, 16, 2, 0x6b4a10);
  px(box, 6, 5, 4, 10, 0x6b4a10, 0.3);
  px(box, 0, 4, 16, 1, 0xc8a060, 0.3);
  box.generateTexture('shipping_box', 16, 16);
  box.destroy();

  // Wooden sign
  const sign = scene.add.graphics();
  px(sign, 6, 10, 2, 6, C.WOOD_DARK);
  px(sign, 2, 4, 12, 8, C.WOOD);
  px(sign, 2, 4, 12, 1, 0xc0a070, 0.5);
  px(sign, 2, 11, 12, 1, C.WOOD_DARK, 0.5);
  sign.generateTexture('sign', 16, 16);
  sign.destroy();

  // Portal / door to transition
  const portal = scene.add.graphics();
  px(portal, 3, 0, 10, 16, 0x604080);
  px(portal, 4, 0, 8, 16, 0x8040c0, 0.7);
  px(portal, 5, 0, 6, 16, 0xc080ff, 0.4);
  px(portal, 3, 0, 10, 1, 0xffffff, 0.3);
  portal.generateTexture('portal', 16, 16);
  portal.destroy();
}
