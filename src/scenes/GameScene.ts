/**
 * GameScene — the main gameplay scene.
 *
 * Responsibilities (high level):
 * - Instantiate and wire up all game systems
 * - Build the map and place entities
 * - Run the update loop and delegate to systems
 * - Handle scene transitions (farm ↔ town)
 * - Auto-save
 *
 * NOT responsible for:
 * - Farming logic  → FarmingSystem
 * - Inventory logic → InventorySystem
 * - Time logic      → TimeSystem
 * - Save/load       → SaveSystem
 * - UI rendering    → UIScene / HUD
 */

import Phaser from 'phaser';
import {
  TILE_SIZE,
  SCENE_KEYS,
  AUTO_SAVE_INTERVAL_MS,
  CAMERA_ZOOM,
} from '../config/gameConfig';

import { Season } from '../types/GameTime';
import type { GameTime } from '../types/GameTime';
import type { GameState } from '../types/GameState';
import {
  Direction,
  PLAYER_DEFAULT_MONEY,
  PLAYER_DEFAULT_STAMINA,
  PLAYER_MAX_INVENTORY_SLOTS,
} from '../types/Player';
import type { PlayerState } from '../types/Player';

import { TimeSystem } from '../systems/TimeSystem';
import { FarmingSystem } from '../systems/FarmingSystem';
import { InventorySystem } from '../systems/InventorySystem';
import { saveSystem } from '../systems/SaveSystem';
import { gameEvents } from '../managers/EventManager';

import { Player } from '../entities/Player';
import type { HUD } from '../ui/HUD';
import { getItemDefinition } from '../data/items/itemDefinitions';

import {
  buildTileLayer,
  buildCollisionLayer,
  FARM_GROUND_LAYER,
  FARM_COLLISION_LAYER,
  TOWN_GROUND_LAYER,
  TOWN_COLLISION_LAYER,
  FARM_OBJECTS,
  TOWN_OBJECTS,
  getFarmPlotCoords,
  TILE_IDS,
} from '../utils/MapBuilder';
import type { MapObjectDef } from '../utils/MapBuilder';

import { DIALOGUE_DEFINITIONS } from '../data/dialogue/dialogueDefinitions';
import { getCropDefinition } from '../data/crops/cropDefinitions';
import type { CropState } from '../types/Crop';

// ─── Interactable wrapper ────────────────────────────────────────────────────

interface SceneInteractable {
  tileX: number;
  tileY: number;
  label: string;
  onInteract: () => void;
}

type MapKey = 'farm' | 'town';

// ─── UIScene type for HUD access ────────────────────────────────────────────

interface UISceneRef extends Phaser.Scene {
  hud?: HUD;
}

// ─── GameScene ────────────────────────────────────────────────────────────────

export class GameScene extends Phaser.Scene {
  // Systems
  private timeSystem!: TimeSystem;
  private farmingSystem!: FarmingSystem;
  private inventorySystem!: InventorySystem;

  // Player state mirrors
  private playerMoney = PLAYER_DEFAULT_MONEY;
  private playerStamina = PLAYER_DEFAULT_STAMINA;

  // Entities
  private player!: Player;

  // Map
  private currentMap: MapKey = 'farm';
  private collisionGroup!: Phaser.Physics.Arcade.StaticGroup;
  private playerCollider: Phaser.Physics.Arcade.Collider | undefined;
  private mapGameObjects: Phaser.GameObjects.GameObject[] = [];
  private tileImages: Phaser.GameObjects.Image[] = []; // tracked for cleanup on transition

  // Interactables
  private interactables: SceneInteractable[] = [];
  private nearbyInteractable: SceneInteractable | null = null;

  // Farm plot visuals
  private plotSprites: Map<string, Phaser.GameObjects.Image> = new Map();
  private cropSprites: Map<string, Phaser.GameObjects.Image> = new Map();

  // HUD reference (lives in UIScene)
  private hud: HUD | null = null;

  // Active tool
  private activeTool = 0;

  // Auto-save timer
  private autoSaveTimer = 0;

  // Transition lock
  private isTransitioning = false;

  // Day listener reference for cleanup
  private dayStartedListener: ((p: { day: number; season: string; year: number }) => void) | null =
    null;

  constructor() {
    super({ key: SCENE_KEYS.GAME });
  }

  // Called by UIScene to get initial HUD state
  getInitialHUDState(): { time: GameTime; player: PlayerState } {
    return {
      time: this.timeSystem?.getTime() ?? {
        year: 1,
        season: Season.SPRING,
        day: 1,
        hour: 6,
        minute: 0,
      },
      player: this.buildPlayerState(),
    };
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  init(data: Record<string, unknown>): void {
    this.isTransitioning = false;
    const isNewGame = data['newGame'] !== false;

    if (!isNewGame) {
      const saved = saveSystem.load();
      if (saved) {
        this.restoreFromSave(saved);
        return;
      }
    }

    this.initNewGame();
  }

  create(): void {
    this.getHUDRef();
    this.buildMap(this.currentMap);
    this.createPlayer();
    this.setupCamera();
    this.setupSystemListeners();
    this.setupToolCycle();
    this.setupSleepKey();

    this.time.delayedCall(150, () => {
      this.hud?.init({
        time: this.timeSystem.getTime(),
        player: this.buildPlayerState(),
        inventorySlots: this.inventorySystem.getSlots(),
      });
      this.setActiveSlot(this.activeTool);
      this.hud?.fadeIn();
    });

    this.timeSystem.resume();
  }

  override update(_time: number, delta: number): void {
    this.player.update(delta);
    this.timeSystem.update(delta);
    this.checkNearbyInteractables();

    this.autoSaveTimer += delta;
    if (this.autoSaveTimer >= AUTO_SAVE_INTERVAL_MS) {
      this.autoSaveTimer = 0;
      this.saveGame();
    }
  }

  // ─── Game State ───────────────────────────────────────────────────────────

  private initNewGame(): void {
    this.timeSystem = new TimeSystem();
    this.farmingSystem = new FarmingSystem();
    this.inventorySystem = new InventorySystem({
      slots: [],
      maxSlots: PLAYER_MAX_INVENTORY_SLOTS,
    });
    this.playerMoney = PLAYER_DEFAULT_MONEY;
    this.playerStamina = PLAYER_DEFAULT_STAMINA;
    this.currentMap = 'farm';

    this.inventorySystem.addItem('turnip_seed', 8);
    this.inventorySystem.addItem('potato_seed', 5);
    this.inventorySystem.addItem('watering_can', 1);
    this.inventorySystem.addItem('hoe', 1);
  }

  private restoreFromSave(saved: GameState): void {
    this.timeSystem = new TimeSystem(saved.time);
    this.farmingSystem = new FarmingSystem();
    this.farmingSystem.restoreFromState(saved.farm);
    this.inventorySystem = new InventorySystem();
    this.inventorySystem.restoreFromState(saved.player.inventory);
    this.playerMoney = saved.player.money;
    this.playerStamina = saved.player.stamina;
    this.currentMap = 'farm';
  }

  private buildPlayerState(): PlayerState {
    return {
      x: this.player?.x ?? 5 * TILE_SIZE,
      y: this.player?.y ?? 6 * TILE_SIZE,
      money: this.playerMoney,
      stamina: this.playerStamina,
      maxStamina: PLAYER_DEFAULT_STAMINA,
      direction: this.player?.getDirection() ?? Direction.DOWN,
      inventory: this.inventorySystem.getState() as {
        slots: { itemId: string; quantity: number }[];
        maxSlots: number;
      },
      activeToolSlot: this.activeTool,
    };
  }

  private buildGameState(): GameState {
    return {
      version: '1.0.0',
      time: { ...this.timeSystem.getTime() },
      player: this.buildPlayerState(),
      weather: 'sunny',
      farm: this.farmingSystem.getState() as GameState['farm'],
    };
  }

  // ─── Map Building ─────────────────────────────────────────────────────────

  private buildMap(mapKey: MapKey): void {
    const groundLayer = mapKey === 'farm' ? FARM_GROUND_LAYER : TOWN_GROUND_LAYER;
    const collisionLayer = mapKey === 'farm' ? FARM_COLLISION_LAYER : TOWN_COLLISION_LAYER;
    const objects = mapKey === 'farm' ? FARM_OBJECTS : TOWN_OBJECTS;

    const mapH = groundLayer.length;
    const mapW = (groundLayer[0] ?? []).length;

    // Track tile images so they can be destroyed on map transition
    this.tileImages = buildTileLayer(this, groundLayer, 0);
    this.collisionGroup = buildCollisionLayer(this, collisionLayer);
    this.placeMapObjects(objects, mapKey);

    if (mapKey === 'farm') {
      this.createFarmPlotVisuals();
    }

    const worldW = mapW * TILE_SIZE;
    const worldH = mapH * TILE_SIZE;
    this.physics.world.setBounds(0, 0, worldW, worldH);
    if (this.player) {
      this.player.setWorldBounds(worldW, worldH);
    }
  }

  private placeMapObjects(objects: MapObjectDef[], mapKey: MapKey): void {
    this.interactables = [];

    for (const obj of objects) {
      const ox = obj.tileX * TILE_SIZE + TILE_SIZE / 2;
      const oy = obj.tileY * TILE_SIZE + TILE_SIZE / 2;

      switch (obj.type) {
        case 'house': {
          const h = this.add.image(ox, oy - 8, 'house').setDepth(5).setOrigin(0.5, 1);
          this.mapGameObjects.push(h);
          break;
        }
        case 'shop': {
          const s = this.add.image(ox, oy - 8, 'shop').setDepth(5).setOrigin(0.5, 1);
          this.mapGameObjects.push(s);
          break;
        }
        case 'tree': {
          const t = this.add.image(ox, oy, 'tree').setDepth(10).setOrigin(0.5, 1);
          this.mapGameObjects.push(t);
          break;
        }
        case 'sign': {
          const sign = this.add.image(ox, oy, 'sign').setDepth(5).setOrigin(0.5, 1);
          this.mapGameObjects.push(sign);
          if (obj.dialogueId) {
            const dialogueId = obj.dialogueId;
            this.interactables.push({
              tileX: obj.tileX,
              tileY: obj.tileY,
              label: obj.label ?? 'Read',
              onInteract: () => this.showDialogue(dialogueId),
            });
          }
          break;
        }
        case 'shipping_box': {
          const box = this.add.image(ox, oy, 'shipping_box').setDepth(5).setOrigin(0.5, 1);
          this.mapGameObjects.push(box);
          this.interactables.push({
            tileX: obj.tileX,
            tileY: obj.tileY,
            label: 'Ship Items',
            onInteract: () => this.openShippingBox(),
          });
          break;
        }
        case 'door': {
          const dest = obj.destination;
          if (!dest) break;
          const doorTileX = obj.tileX;
          const doorTileY = obj.tileY;
          if (dest.map !== mapKey) {
            const portal = this.add.image(ox, oy, 'portal').setDepth(3).setAlpha(0.6);
            this.mapGameObjects.push(portal);
            this.tweens.add({
              targets: portal,
              alpha: 0.3,
              duration: 1000,
              yoyo: true,
              repeat: -1,
            });
          }
          const destMap = dest.map as MapKey;
          const destX = dest.spawnX;
          const destY = dest.spawnY;
          const label = obj.label ?? 'Enter';
          this.interactables.push({
            tileX: doorTileX,
            tileY: doorTileY,
            label,
            onInteract: () => this.transitionToMap(destMap, destX, destY),
          });
          break;
        }
        case 'npc': {
          const npc = this.add.image(ox, oy, 'npc_default').setDepth(8).setOrigin(0.5, 1);
          this.mapGameObjects.push(npc);
          this.tweens.add({
            targets: npc,
            y: oy - 1,
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
          if (obj.dialogueId) {
            const dialogueId = obj.dialogueId;
            this.interactables.push({
              tileX: obj.tileX,
              tileY: obj.tileY,
              label: obj.label ?? 'Talk',
              onInteract: () => this.showDialogue(dialogueId),
            });
          }
          break;
        }
      }
    }
  }

  // ─── Farm Visuals ─────────────────────────────────────────────────────────

  private createFarmPlotVisuals(): void {
    this.plotSprites.clear();
    this.cropSprites.clear();

    const farmPlots = getFarmPlotCoords();
    const farmState = this.farmingSystem.getState();

    for (const { x, y } of farmPlots) {
      const plotKey = `${x},${y}`;
      const ox = x * TILE_SIZE + TILE_SIZE / 2;
      const oy = y * TILE_SIZE + TILE_SIZE / 2;
      const plot = farmState.plots[plotKey];
      if (plot?.tilled) {
        const textureKey = plot.watered ? 'tile_soil_watered' : 'tile_soil_tilled';
        const img = this.add.image(ox, oy, textureKey).setDepth(1);
        this.plotSprites.set(plotKey, img);
      }
    }

    for (const cropId in farmState.crops) {
      const crop = farmState.crops[cropId];
      if (crop) this.renderCrop(crop);
    }
  }

  private renderCrop(crop: CropState): void {
    const parts = crop.plotKey.split(',');
    const tx = parseInt(parts[0] ?? '0', 10);
    const ty = parseInt(parts[1] ?? '0', 10);
    const ox = tx * TILE_SIZE + TILE_SIZE / 2;
    const oy = ty * TILE_SIZE + TILE_SIZE / 2;

    const existing = this.cropSprites.get(crop.id);
    if (existing) existing.destroy();

    const textureKey = `crop_${crop.stage}`;
    const img = this.add.image(ox, oy, textureKey).setDepth(6).setOrigin(0.5, 1);
    this.cropSprites.set(crop.id, img);
  }

  private updateFarmPlotVisual(plotKey: string): void {
    const plot = this.farmingSystem.getPlot(plotKey);
    if (!plot) return;

    const parts = plotKey.split(',');
    const tx = parseInt(parts[0] ?? '0', 10);
    const ty = parseInt(parts[1] ?? '0', 10);
    const ox = tx * TILE_SIZE + TILE_SIZE / 2;
    const oy = ty * TILE_SIZE + TILE_SIZE / 2;

    const existing = this.plotSprites.get(plotKey);
    if (existing) existing.destroy();

    if (plot.tilled) {
      const textureKey = plot.watered ? 'tile_soil_watered' : 'tile_soil_tilled';
      const img = this.add.image(ox, oy, textureKey).setDepth(1);
      this.plotSprites.set(plotKey, img);
    }
  }

  // ─── Player ───────────────────────────────────────────────────────────────

  private createPlayer(): void {
    const groundLayer = this.currentMap === 'farm' ? FARM_GROUND_LAYER : TOWN_GROUND_LAYER;
    const mapW = (groundLayer[0] ?? []).length * TILE_SIZE;
    const mapH = groundLayer.length * TILE_SIZE;

    const spawnX = 5 * TILE_SIZE + TILE_SIZE / 2;
    const spawnY = 6 * TILE_SIZE + TILE_SIZE / 2;

    this.player = new Player(this, spawnX, spawnY);
    this.player.setWorldBounds(mapW, mapH);
    this.player.onInteract = () => this.handlePlayerInteract();

    if (this.playerCollider) {
      this.playerCollider.destroy();
    }
    this.playerCollider = this.physics.add.collider(this.player.getSprite(), this.collisionGroup);
  }

  private spawnPlayerAt(tileX: number, tileY: number): void {
    const x = tileX * TILE_SIZE + TILE_SIZE / 2;
    const y = tileY * TILE_SIZE + TILE_SIZE / 2;
    this.player.setPosition(x, y);
    if (this.player.physicsBody) {
      this.player.physicsBody.setVelocity(0, 0);
      this.player.physicsBody.reset(x, y);
    }
  }

  // ─── Camera ───────────────────────────────────────────────────────────────

  private setupCamera(): void {
    const groundLayer = this.currentMap === 'farm' ? FARM_GROUND_LAYER : TOWN_GROUND_LAYER;
    const mapW = (groundLayer[0] ?? []).length * TILE_SIZE;
    const mapH = groundLayer.length * TILE_SIZE;

    this.cameras.main.setZoom(CAMERA_ZOOM);
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
  }

  // ─── Interaction ──────────────────────────────────────────────────────────

  private checkNearbyInteractables(): void {
    const playerTile = this.player.getTilePosition();
    const facing = this.player.getFacingTile();
    let found: SceneInteractable | null = null;

    for (const interactable of this.interactables) {
      const isFacing = interactable.tileX === facing.x && interactable.tileY === facing.y;
      const dx = Math.abs(interactable.tileX - playerTile.x);
      const dy = Math.abs(interactable.tileY - playerTile.y);
      if (isFacing || (dx <= 1 && dy <= 1 && dx + dy <= 1)) {
        found = interactable;
        break;
      }
    }

    // Farm plot interactions
    if (!found && this.currentMap === 'farm') {
      const facingKey = `${facing.x},${facing.y}`;
      const groundRow = FARM_GROUND_LAYER[facing.y];
      const tileId = groundRow ? groundRow[facing.x] : undefined;
      const farmPlots = getFarmPlotCoords();
      const isFarmPlot =
        farmPlots.some((p) => p.x === facing.x && p.y === facing.y) ||
        tileId === TILE_IDS.SOIL;

      if (isFarmPlot) {
        found = {
          tileX: facing.x,
          tileY: facing.y,
          label: this.getFarmPlotLabel(facingKey),
          onInteract: () => this.handleFarmPlotInteract(facingKey),
        };
      }
    }

    if (found !== this.nearbyInteractable) {
      this.nearbyInteractable = found;
      if (found) {
        gameEvents.emit('INTERACTION_STARTED', { label: found.label });
      } else {
        gameEvents.emit('INTERACTION_ENDED');
      }
    }
  }

  private getHeldItemId(): string | null {
    const slots = this.inventorySystem.getSlots();
    const currentSlot = slots[this.activeTool];
    return currentSlot && currentSlot.quantity > 0 ? currentSlot.itemId : null;
  }

  private getFarmPlotLabel(plotKey: string): string {
    const plot = this.farmingSystem.getPlot(plotKey);
    const heldId = this.getHeldItemId();

    const crop = plot?.cropId ? this.farmingSystem.getCrop(plot.cropId) : undefined;
    if (crop?.harvestable) return 'Harvest [Space]';

    if (!plot || !plot.tilled) {
      return heldId === 'hoe' ? 'Till Soil [Hoe]' : 'Till Soil';
    }

    if (!crop) {
      if (heldId && (heldId.endsWith('_seed') || heldId.includes('seed'))) {
        const def = getItemDefinition(heldId);
        return `Plant ${def?.name ?? 'Seed'}`;
      }
      return 'Plant Seed';
    }

    if (!plot.watered) {
      return heldId === 'watering_can' ? 'Water [Can]' : 'Water Plot';
    }

    return `${crop.stage} (${crop.growthProgress}d)`;
  }

  private handlePlayerInteract(): void {
    if (this.hud?.isDialogueActive()) {
      this.hud.tryAdvanceDialogue();
      return;
    }
    if (this.hud?.isInventoryOpen()) {
      this.hud.closeInventory();
      return;
    }
    if (this.nearbyInteractable) {
      this.nearbyInteractable.onInteract();
    }
  }

  private handleFarmPlotInteract(plotKey: string): void {
    const plot = this.farmingSystem.getPlot(plotKey);
    const heldId = this.getHeldItemId();

    // 1. Harvest ripe crop if present
    const crop = plot?.cropId ? this.farmingSystem.getCrop(plot.cropId) : undefined;
    if (crop?.harvestable) {
      const harvestedId = this.farmingSystem.harvestCrop(plotKey);
      if (harvestedId) {
        this.inventorySystem.addItem(harvestedId, 1);
        const def = getCropDefinition(harvestedId);
        this.hud?.showNotification(`Harvested ${def?.name ?? harvestedId}!`);
        const oldSprite = this.cropSprites.get(crop.id);
        oldSprite?.destroy();
        this.cropSprites.delete(crop.id);

        const updatedCrop = this.farmingSystem.getCropAtPlot(plotKey);
        if (updatedCrop) this.renderCrop(updatedCrop);
        this.updateFarmPlotVisual(plotKey);
        this.spendStamina(2);
        this.syncInventoryAndHeldItem();
      }
      return;
    }

    // 2. Till soil if untilled
    if (!plot || !plot.tilled) {
      if (this.farmingSystem.tillSoil(plotKey)) {
        this.updateFarmPlotVisual(plotKey);
        this.spendStamina(3);
      }
      return;
    }

    // 3. Plant seed if plot has no crop
    if (!crop) {
      // Prioritize currently held seed, otherwise fallback to available seed
      let seedToPlant: string | null = null;
      if (heldId && (heldId.endsWith('_seed') || heldId.includes('seed')) && this.inventorySystem.hasItem(heldId)) {
        seedToPlant = heldId;
      } else {
        seedToPlant = this.findAvailableSeed();
      }

      if (seedToPlant && this.inventorySystem.removeItem(seedToPlant, 1)) {
        if (this.farmingSystem.plantSeed(plotKey, seedToPlant)) {
          const newCrop = this.farmingSystem.getCropAtPlot(plotKey);
          if (newCrop) this.renderCrop(newCrop);
          this.updateFarmPlotVisual(plotKey);
          this.spendStamina(2);
          this.syncInventoryAndHeldItem();
        }
      } else {
        this.hud?.showNotification('No seeds equipped! Select a seed in hotbar.');
      }
      return;
    }

    // 4. Water plot if dry
    if (!plot.watered) {
      if (this.farmingSystem.waterPlot(plotKey)) {
        this.updateFarmPlotVisual(plotKey);
        this.spendStamina(2);
      }
    }
  }

  private findAvailableSeed(): string | null {
    const seeds = ['turnip_seed', 'potato_seed', 'tomato_seed'];
    for (const seed of seeds) {
      if (this.inventorySystem.hasItem(seed)) return seed;
    }
    return null;
  }

  private spendStamina(amount: number): void {
    this.playerStamina = Math.max(0, this.playerStamina - amount);
    gameEvents.emit('PLAYER_STAMINA_CHANGED', {
      amount: -amount,
      newTotal: this.playerStamina,
    });
  }

  private addMoney(amount: number): void {
    this.playerMoney += amount;
    gameEvents.emit('PLAYER_MONEY_CHANGED', { amount, newTotal: this.playerMoney });
  }

  // ─── Dialogue ─────────────────────────────────────────────────────────────

  private showDialogue(dialogueId: string): void {
    const tree = DIALOGUE_DEFINITIONS[dialogueId];
    if (!tree) return;
    const speakerName =
      tree.lines[0]?.speakerId === 'sign' ? '— Sign —' : (tree.lines[0]?.speakerId ?? '');
    const lines = tree.lines.map((l) => l.text);
    this.hud?.showDialogue(speakerName, lines, () => {
      this.timeSystem.resume();
    });
    this.timeSystem.pause();
  }

  // ─── Shipping ─────────────────────────────────────────────────────────────

  private openShippingBox(): void {
    const shippableItems = ['turnip', 'potato', 'tomato'];
    const prices: Record<string, number> = { turnip: 60, potato: 80, tomato: 60 };
    let total = 0;

    for (const itemId of shippableItems) {
      const count = this.inventorySystem.getItemCount(itemId);
      if (count > 0) {
        total += count * (prices[itemId] ?? 50);
        this.inventorySystem.removeItem(itemId, count);
      }
    }

    if (total > 0) {
      this.addMoney(total);
      this.hud?.showNotification(`Shipped! +${total}G`);
    } else {
      this.hud?.showDialogue('Shipping Box', ['Nothing to ship yet.', 'Harvest crops first!'], () =>
        this.timeSystem.resume()
      );
      this.timeSystem.pause();
    }
  }

  // ─── System Listeners ─────────────────────────────────────────────────────

  private setupSystemListeners(): void {
    // Remove previous listener to avoid duplicates on map transitions
    if (this.dayStartedListener) {
      gameEvents.off('DAY_STARTED', this.dayStartedListener);
    }

    this.dayStartedListener = ({ day, season, year }) => {
      this.farmingSystem.advanceDay(this.timeSystem.getTime());
      this.refreshAllCropVisuals();
      this.playerStamina = PLAYER_DEFAULT_STAMINA;
      gameEvents.emit('PLAYER_STAMINA_CHANGED', {
        amount: PLAYER_DEFAULT_STAMINA,
        newTotal: PLAYER_DEFAULT_STAMINA,
      });
      const seasonName = season.charAt(0) + season.slice(1).toLowerCase();
      this.hud?.showNotification(`Day ${day} - ${seasonName} Y${year}`);
      this.saveGame();
    };

    gameEvents.on('DAY_STARTED', this.dayStartedListener);
  }

  private refreshAllCropVisuals(): void {
    const farmState = this.farmingSystem.getState();
    for (const cropId in farmState.crops) {
      const crop = farmState.crops[cropId];
      if (crop) this.renderCrop(crop);
    }
    for (const plotKey in farmState.plots) {
      this.updateFarmPlotVisual(plotKey);
    }
  }

  // ─── Tool & Inventory System ─────────────────────────────────────────────

  public setActiveSlot(slotIndex: number): void {
    const maxSlots = 6;
    this.activeTool = ((slotIndex % maxSlots) + maxSlots) % maxSlots;
    this.syncInventoryAndHeldItem();

    const heldId = this.getHeldItemId();
    if (heldId) {
      const def = getItemDefinition(heldId);
      const name = def?.name ?? heldId.replace(/_/g, ' ');
      this.hud?.showNotification(`Equipped [${this.activeTool + 1}]: ${name}`);
    } else {
      this.hud?.showNotification(`[${this.activeTool + 1}] Empty Hand`);
    }
  }

  private syncInventoryAndHeldItem(): void {
    const slots = this.inventorySystem.getSlots();
    const currentSlot = slots[this.activeTool];
    const itemId = currentSlot && currentSlot.quantity > 0 ? currentSlot.itemId : null;
    if (this.player) {
      this.player.setHeldItem(itemId);
    }
    if (this.hud) {
      this.hud.updateHotbar(slots, this.activeTool);
    }
  }

  private setupToolCycle(): void {
    if (!this.input.keyboard) return;

    // Number keys 1 through 6
    const numKeys = [
      Phaser.Input.Keyboard.KeyCodes.ONE,
      Phaser.Input.Keyboard.KeyCodes.TWO,
      Phaser.Input.Keyboard.KeyCodes.THREE,
      Phaser.Input.Keyboard.KeyCodes.FOUR,
      Phaser.Input.Keyboard.KeyCodes.FIVE,
      Phaser.Input.Keyboard.KeyCodes.SIX,
    ];

    numKeys.forEach((keyCode, idx) => {
      this.input.keyboard?.addKey(keyCode).on('down', () => {
        this.setActiveSlot(idx);
      });
    });

    // Tab, E: Next Slot
    const tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
    tabKey.on('down', () => {
      this.setActiveSlot(this.activeTool + 1);
    });

    const eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    eKey.on('down', () => {
      if (this.hud?.isInventoryOpen()) {
        this.hud.closeInventory();
      } else {
        this.setActiveSlot(this.activeTool + 1);
      }
    });

    // Q: Previous Slot
    const qKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    qKey.on('down', () => {
      this.setActiveSlot(this.activeTool - 1);
    });

    // I / B: Open/Close Inventory Bag
    const iKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.I);
    iKey.on('down', () => {
      this.hud?.toggleInventory(this.inventorySystem.getSlots());
    });

    const bKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
    bKey.on('down', () => {
      this.hud?.toggleInventory(this.inventorySystem.getSlots());
    });

    // Escape: Close Inventory or Dialogue
    const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    escKey.on('down', () => {
      if (this.hud?.isInventoryOpen()) {
        this.hud.closeInventory();
      }
    });

    // H / C: Toggle Holding Item above head vs pocket
    const hKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H);
    hKey.on('down', () => {
      const isHolding = this.player.toggleHolding();
      this.hud?.showNotification(isHolding ? 'Holding Item' : 'Item Lowered');
    });

    // Mouse wheel cycling
    this.input.on('wheel', (_pointer: unknown, _gameObjects: unknown, _deltaX: number, deltaY: number) => {
      if (deltaY > 0) {
        this.setActiveSlot(this.activeTool + 1);
      } else if (deltaY < 0) {
        this.setActiveSlot(this.activeTool - 1);
      }
    });
  }

  // ─── Sleep ────────────────────────────────────────────────────────────────

  private setupSleepKey(): void {
    if (!this.input.keyboard) return;
    const zKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    zKey.on('down', () => {
      if (this.isTransitioning) return;
      this.isTransitioning = true;
      this.hud?.fadeOut(() => {
        this.timeSystem.sleep();
        this.timeSystem.resume();
        this.hud?.showNotification('Good morning!');
        this.hud?.fadeIn(() => {
          this.isTransitioning = false;
        });
      });
    });
  }

  // ─── Map Transitions ──────────────────────────────────────────────────────

  private transitionToMap(destMap: MapKey, spawnTileX: number, spawnTileY: number): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.timeSystem.pause();

    const executeTransition = () => {
      try {
        if (destMap === this.currentMap) {
          this.spawnPlayerAt(spawnTileX, spawnTileY);
          this.setupCamera();
        } else {
          this.saveGame();
          this.clearMapObjects();
          this.currentMap = destMap;
          this.buildMap(destMap);
          this.spawnPlayerAt(spawnTileX, spawnTileY);
          this.setupCamera();
          this.setupSystemListeners();
          if (this.playerCollider) {
            this.playerCollider.destroy();
          }
          this.playerCollider = this.physics.add.collider(this.player.getSprite(), this.collisionGroup);
        }
      } catch (err) {
        console.error('Error during map transition:', err);
      } finally {
        this.timeSystem.resume();
        if (this.hud) {
          this.hud.fadeIn(() => {
            this.isTransitioning = false;
          });
        } else {
          this.isTransitioning = false;
        }
      }
    };

    if (this.hud) {
      this.hud.fadeOut(() => {
        executeTransition();
      });
    } else {
      executeTransition();
    }
  }

  private clearMapObjects(): void {
    if (this.playerCollider) {
      this.playerCollider.destroy();
      this.playerCollider = undefined;
    }

    // Destroy tile layer images from the previous map
    for (const img of this.tileImages) {
      if (img.active) img.destroy();
    }
    this.tileImages = [];

    // Destroy previous collision bodies
    if (this.collisionGroup) {
      this.collisionGroup.clear(true, true);
      this.collisionGroup.destroy();
    }

    // Destroy placed objects (house, trees, NPCs, signs, etc.)
    for (const obj of this.mapGameObjects) {
      if (obj.active) {
        this.tweens.killTweensOf(obj);
        obj.destroy();
      }
    }
    this.mapGameObjects = [];

    for (const [, sprite] of this.plotSprites) {
      if (sprite.active) sprite.destroy();
    }
    this.plotSprites.clear();

    for (const [, sprite] of this.cropSprites) {
      if (sprite.active) sprite.destroy();
    }
    this.cropSprites.clear();

    this.interactables = [];
    this.nearbyInteractable = null;
  }

  // ─── Save ─────────────────────────────────────────────────────────────────

  private saveGame(): void {
    saveSystem.save(this.buildGameState());
  }

  // ─── HUD access ───────────────────────────────────────────────────────────

  private getHUDRef(): void {
    const uiScene = this.scene.get(SCENE_KEYS.UI) as UISceneRef;
    if (uiScene?.hud) {
      this.hud = uiScene.hud;
      this.hud.onSelectSlot = (idx) => this.setActiveSlot(idx);
      this.syncInventoryAndHeldItem();
    } else {
      this.time.delayedCall(200, () => {
        const ui = this.scene.get(SCENE_KEYS.UI) as UISceneRef;
        if (ui?.hud) {
          this.hud = ui.hud;
          this.hud.onSelectSlot = (idx) => this.setActiveSlot(idx);
          this.syncInventoryAndHeldItem();
        }
      });
    }
  }
}
