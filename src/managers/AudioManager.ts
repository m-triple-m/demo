/**
 * AudioManager — centralized audio control.
 * Stub implementation; connect to Phaser's sound system in GameScene.
 *
 * All audio calls go through this manager so that:
 * - Volume control is centralized
 * - Future music crossfade / SFX pooling is easy to add
 * - Systems don't need Phaser references to play sounds
 */

import type Phaser from 'phaser';

export class AudioManager {
  private static instance: AudioManager;
  private scene: Phaser.Scene | null = null;

  private musicVolume = 0.7;
  private sfxVolume = 1.0;
  private currentMusicKey: string | null = null;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /** Called once when Phaser is ready. */
  setScene(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  playMusic(key: string, loop = true): void {
    if (!this.scene) return;
    if (this.currentMusicKey === key) return;
    // Stop previous music if playing
    if (this.currentMusicKey) {
      this.scene.sound.stopByKey(this.currentMusicKey);
    }
    this.currentMusicKey = key;
    this.scene.sound.play(key, { loop, volume: this.musicVolume });
  }

  stopMusic(): void {
    if (!this.scene || !this.currentMusicKey) return;
    this.scene.sound.stopByKey(this.currentMusicKey);
    this.currentMusicKey = null;
  }

  playSfx(key: string, volume?: number): void {
    if (!this.scene) return;
    this.scene.sound.play(key, { volume: volume ?? this.sfxVolume });
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }
}

export const audioManager = AudioManager.getInstance();
