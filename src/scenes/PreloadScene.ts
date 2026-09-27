/**
 * PreloadScene — generates all procedural pixel-art assets.
 *
 * Since we use programmatic textures rather than external files,
 * "preloading" here means generating the textures via Phaser Graphics.
 *
 * When real sprite sheets are ready:
 * - Add this.load.spritesheet(...) calls
 * - Remove the generateAssets() call
 * - The rest of the game is unchanged
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS } from '../config/gameConfig';
import { generateAssets } from '../utils/AssetGenerator';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.PRELOAD });
  }

  preload(): void {
    // Show a loading bar
    this.createLoadingBar();

    // No external assets to load for now.
    // When adding real assets, add this.load.xxx() calls here.
    // Example:
    //   this.load.spritesheet('player', 'assets/player.png', { frameWidth: 16, frameHeight: 16 });
    //   this.load.tilemapTiledJSON('farm_map', 'assets/maps/farm.json');
  }

  create(): void {
    // Generate all procedural textures now that Phaser is ready
    generateAssets(this);

    // All assets ready — go to main menu
    this.scene.start(SCENE_KEYS.MAIN_MENU);
  }

  private createLoadingBar(): void {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.add.text(cx, cy - 20, 'FARM LIFE', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#5a8a3a',
    }).setOrigin(0.5);

    this.add.text(cx, cy, 'Loading...', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '6px',
      color: '#888888',
    }).setOrigin(0.5);

    // Progress bar background
    this.add.rectangle(cx, cy + 20, 100, 6, 0x333333);
    const bar = this.add.rectangle(cx - 50, cy + 20, 0, 5, 0x5a8a3a).setOrigin(0, 0.5);

    this.load.on('progress', (value: number) => {
      bar.width = 100 * value;
    });
  }
}
