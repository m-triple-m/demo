/**
 * UIScene — runs in parallel with GameScene.
 *
 * Owns the HUD instance and acts as a thin bridge between
 * the HUD and the rest of the game.
 * The camera in this scene is fixed (no scrolling).
 */

import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/gameConfig';
import { HUD } from '../ui/HUD';

export class UIScene extends Phaser.Scene {
  hud!: HUD;

  constructor() {
    super({ key: SCENE_KEYS.UI, active: false });
  }

  create(): void {
    this.hud = new HUD(this);

    // Listen for game scene to pass initial state
    const gameScene = this.scene.get(SCENE_KEYS.GAME) as Phaser.Scene & {
      getInitialHUDState?: () => Parameters<HUD['init']>[0];
    };

    if (gameScene?.getInitialHUDState) {
      const state = gameScene.getInitialHUDState();
      this.hud.init(state);
    }
  }

  getHUD(): HUD {
    return this.hud;
  }
}
