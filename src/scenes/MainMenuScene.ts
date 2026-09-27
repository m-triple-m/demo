/**
 * MainMenuScene — the game's title screen.
 *
 * Shows the game title, "New Game" and "Continue" buttons.
 * Checks for an existing save to enable Continue.
 *
 * Layout is sized for the 640×360 canvas (2× the old 320×180).
 */

import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS } from '../config/gameConfig';
import { saveSystem } from '../systems/SaveSystem';

const FONT_TITLE = {
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '28px',      // was 14px at 320×180 → doubled
  color: '#d4e890',
  stroke: '#1a3010',
  strokeThickness: 4,
};

const FONT_SUBTITLE = {
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '10px',      // was 5px → doubled
  color: '#8ab050',
};

const FONT_BTN = {
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '12px',      // was 6px → doubled
  color: '#d4e890',
};

const FONT_FOOTER = {
  fontFamily: '"Press Start 2P", monospace',
  fontSize: '8px',       // was 4px → doubled
  color: '#445544',
};

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.MAIN_MENU });
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const hasSave = saveSystem.exists();

    // Background
    this.add.image(0, 0, 'main_menu_bg').setOrigin(0, 0);

    // Title
    this.add
      .text(cx, 90, 'FARM LIFE', FONT_TITLE)
      .setOrigin(0.5);

    // Subtitle
    this.add
      .text(cx, 130, 'A simple farming life', FONT_SUBTITLE)
      .setOrigin(0.5);

    // Decorative leaves flanking the title
    this.add.text(cx - 120, 88, '🌿', { fontSize: '22px' }).setOrigin(0.5);
    this.add.text(cx + 120, 88, '🌿', { fontSize: '22px' }).setOrigin(0.5);

    // --- Buttons ---
    const newGameBtn = this.createButton(cx, 210, 'New Game', () => {
      this.startNewGame();
    });

    if (hasSave) {
      this.createButton(cx, 260, 'Continue', () => {
        this.continueGame();
      });
    } else {
      const dimBtn = this.createButton(cx, 260, 'Continue', () => {});
      dimBtn.setAlpha(0.35);
      dimBtn.disableInteractive();
    }

    // Footer / version
    this.add
      .text(cx, GAME_HEIGHT - 16, 'v0.1.0  —  Arrow keys + Space to interact', FONT_FOOTER)
      .setOrigin(0.5);

    // Subtle pulse on New Game button to draw attention
    this.tweens.add({
      targets: newGameBtn,
      scaleY: 1.06,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Blinking cursor next to title
    const cursor = this.add
      .text(cx + 145, 90, '|', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '28px',
        color: '#d4e890',
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: cursor, alpha: 0, duration: 500, yoyo: true, repeat: -1 });

  }

  private createButton(
    x: number,
    y: number,
    label: string,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const bg = this.add.image(0, 0, 'menu_button').setOrigin(0.5, 0.5);
    const text = this.add.text(0, 0, label, FONT_BTN).setOrigin(0.5, 0.5);

    const container = this.add.container(x, y, [bg, text]);
    container.setSize(200, 36);  // matches 200×36 button texture
    container.setInteractive({ cursor: 'pointer' });

    container.on('pointerover', () => {
      bg.setTexture('menu_button_hover');
      text.setColor('#ffffff');
      this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 80 });
    });
    container.on('pointerout', () => {
      bg.setTexture('menu_button');
      text.setColor('#d4e890');
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 80 });
    });
    container.on('pointerdown', () => {
      callback();
    });

    return container;
  }

  private startNewGame(): void {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENE_KEYS.GAME, { newGame: true });
      this.scene.start(SCENE_KEYS.UI);
    });
  }

  private continueGame(): void {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(SCENE_KEYS.GAME, { newGame: false });
      this.scene.start(SCENE_KEYS.UI);
    });
  }
}
