/**
 * BootScene — first scene to run.
 * Sets up pixel-art rendering settings, then immediately loads PreloadScene.
 */

import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/gameConfig';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.BOOT });
  }

  create(): void {
    // Proceed to preload — pixel-art settings are configured in main.ts (render config)
    this.scene.start(SCENE_KEYS.PRELOAD);
  }
}
