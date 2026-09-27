/**
 * Player entity — the Phaser representation of the player character.
 *
 * Responsibilities:
 * - Sprite + animation management
 * - Movement input handling
 * - Camera positioning
 * - Collision setup
 * - Delegation to systems (inventory, farming, etc.) via game state
 *
 * NOT responsible for:
 * - Farming logic (→ FarmingSystem)
 * - Inventory logic (→ InventorySystem)
 * - Time (→ TimeSystem)
 * - Save/load (→ SaveSystem)
 */

import Phaser from 'phaser';
import { Direction } from '../types/Player';
import { PLAYER_SPEED, TILE_SIZE } from '../config/gameConfig';


export class Player {
  readonly scene: Phaser.Scene;
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly physicsBody: Phaser.Physics.Arcade.Body;
  private heldItemSprite: Phaser.GameObjects.Image;
  private heldItemId: string | null = null;
  private isHolding = true;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private direction: Direction = Direction.DOWN;

  /** Callback invoked when the player presses the interact key. */
  onInteract: (() => void) | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // Create arcade sprite
    this.sprite = scene.physics.add.sprite(x, y, 'player', 0);
    this.sprite.setOrigin(0.5, 0.75);
    this.sprite.setDepth(7);

    // Held item floating above player's head
    this.heldItemSprite = scene.add.image(x, y - 14, 'icon_hoe');
    this.heldItemSprite.setOrigin(0.5, 1);
    this.heldItemSprite.setDepth(8);
    this.heldItemSprite.setVisible(false);

    // Configure physics body
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(10, 8);
    body.setOffset(3, 10);
    body.setCollideWorldBounds(true);
    this.physicsBody = body;

    this.setupInput();
    this.createAnimations();
  }

  setHeldItem(itemId: string | null): void {
    this.heldItemId = itemId;
    if (!itemId) {
      this.heldItemSprite.setVisible(false);
      return;
    }
    const textureKey = `icon_${itemId}`;
    if (this.scene.textures.exists(textureKey)) {
      this.heldItemSprite.setTexture(textureKey);
      this.heldItemSprite.setVisible(this.isHolding);
    } else {
      this.heldItemSprite.setVisible(false);
    }
  }

  toggleHolding(): boolean {
    this.isHolding = !this.isHolding;
    if (this.heldItemId) {
      this.heldItemSprite.setVisible(this.isHolding);
    }
    return this.isHolding;
  }

  getHeldItem(): string | null {
    return this.heldItemId;
  }

  isItemHeld(): boolean {
    return this.isHolding && this.heldItemId !== null;
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  setPosition(x: number, y: number): this {
    this.sprite.setPosition(x, y);
    this.heldItemSprite.setPosition(x, y - 14);
    return this;
  }

  private setupInput(): void {
    if (!this.scene.input.keyboard) return;
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.interactKey = this.scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
  }

  private createAnimations(): void {
    const scene = this.scene;
    if (scene.anims.exists('player_idle_down')) return;

    const dirs = [Direction.DOWN, Direction.LEFT, Direction.RIGHT, Direction.UP];
    const dirNames = ['down', 'left', 'right', 'up'];

    for (let i = 0; i < dirs.length; i++) {
      const dir = dirs[i] ?? Direction.DOWN;
      const name = dirNames[i] ?? 'down';

      scene.anims.create({
        key: `player_idle_${dir}`,
        frames: [{ key: `player_${name}_idle` }],
        frameRate: 1,
        repeat: -1,
      });
      scene.anims.create({
        key: `player_walk_${dir}`,
        frames: [
          { key: `player_${name}_idle` },
          { key: `player_${name}_walk1` },
          { key: `player_${name}_idle` },
          { key: `player_${name}_walk2` },
        ],
        frameRate: 8,
        repeat: -1,
      });
    }
  }

  update(_delta: number): void {
    this.handleMovement();
    this.handleInteraction();
    this.updateAnimation();
    this.updateHeldItemPosition();
  }

  private updateHeldItemPosition(): void {
    if (!this.heldItemSprite.visible) return;
    const isMoving = this.isMoving();
    const bob = isMoving ? Math.sin(this.scene.time.now / 120) * 1.5 : 0;
    this.heldItemSprite.setPosition(this.sprite.x, this.sprite.y - 14 + bob);
    this.heldItemSprite.setDepth(this.sprite.depth + 1);
  }

  private handleMovement(): void {
    const speed = PLAYER_SPEED;
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown) {
      vx = -speed;
      this.direction = Direction.LEFT;
    } else if (this.cursors.right.isDown) {
      vx = speed;
      this.direction = Direction.RIGHT;
    }

    if (this.cursors.up.isDown) {
      vy = -speed;
      this.direction = Direction.UP;
    } else if (this.cursors.down.isDown) {
      vy = speed;
      this.direction = Direction.DOWN;
    }

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    this.physicsBody.setVelocity(vx, vy);
  }

  private handleInteraction(): void {
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.onInteract?.();
    }
  }

  private isMoving(): boolean {
    return this.physicsBody.velocity.x !== 0 || this.physicsBody.velocity.y !== 0;
  }

  private updateAnimation(): void {
    const moving = this.isMoving();
    const dirName = this.direction;
    const animKey = moving ? `player_walk_${dirName}` : `player_idle_${dirName}`;

    if (this.sprite.anims.currentAnim?.key !== animKey) {
      this.sprite.play(animKey);
    }
  }

  /** Get the tile coordinates directly in front of the player (facing direction). */
  getFacingTile(): { x: number; y: number } {
    const tx = Math.floor(this.sprite.x / TILE_SIZE);
    const ty = Math.floor(this.sprite.y / TILE_SIZE);

    switch (this.direction) {
      case Direction.UP:
        return { x: tx, y: ty - 1 };
      case Direction.DOWN:
        return { x: tx, y: ty + 1 };
      case Direction.LEFT:
        return { x: tx - 1, y: ty };
      case Direction.RIGHT:
        return { x: tx + 1, y: ty };
    }
  }

  /** Get the player's current tile position. */
  getTilePosition(): { x: number; y: number } {
    return {
      x: Math.floor(this.sprite.x / TILE_SIZE),
      y: Math.floor(this.sprite.y / TILE_SIZE),
    };
  }

  getDirection(): Direction {
    return this.direction;
  }

  setWorldBounds(width: number, height: number): void {
    this.scene.physics.world.setBounds(0, 0, width, height);
    this.physicsBody.setCollideWorldBounds(true);
  }

  /** Expose the underlying sprite for Phaser collider setup. */
  getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.sprite;
  }

  destroy(): void {
    this.heldItemSprite.destroy();
    this.sprite.destroy();
  }
}
