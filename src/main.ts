/**
 * main.ts — game entry point.
 *
 * Creates the Phaser game instance:
 * - Internal resolution: 640×360 (2× denser canvas = sharp text)
 * - Camera zoom 2× in GameScene → same GBA tile scale, crisper pixels
 * - pixelArt mode on (nearest-neighbour scaling, no blur)
 * - Arcade physics (simple AABB)
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config/gameConfig';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,

  // Scale to fill the browser window, preserving aspect ratio
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },

  // Sharp pixel art — no smoothing
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true,
  },

  backgroundColor: '#1a1a1a',

  // Arcade physics — simple AABB, no gravity
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false, // set to true to see hitboxes during development
    },
  },

  // Scene order: Boot → Preload → MainMenu; then Game + UI run together
  scene: [BootScene, PreloadScene, MainMenuScene, GameScene, UIScene],
};

// Launch the game
new Phaser.Game(config);
