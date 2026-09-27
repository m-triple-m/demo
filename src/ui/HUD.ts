/**
 * HUD — pixel-art styled heads-up display.
 *
 * Features:
 * - Bottom-right compact info box: Date, Time, Money, Stamina
 * - Bottom-left Hotbar: 6 quick-access tool/item slots with active selection indicator
 * - Full Inventory Bag modal (opened via [I] / [B] or Bag button)
 * - Interact prompt & Dialogue box
 * - Notification banners and transition overlays
 */

import Phaser from 'phaser';
import { gameEvents } from '../managers/EventManager';
import type { GameTime } from '../types/GameTime';
import type { PlayerState } from '../types/Player';
import type { InventorySlot } from '../types/Item';
import { getItemDefinition } from '../data/items/itemDefinitions';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';

// Font definitions
const FONT = { fontFamily: '"Press Start 2P", monospace', fontSize: '10px', color: '#ffffff' };
const FONT_SM = { ...FONT, fontSize: '8px' };
const FONT_XS = { ...FONT, fontSize: '6px' };
const FONT_DATE = { fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: '#90e0ef' };
const FONT_TIME = { fontFamily: '"Press Start 2P", monospace', fontSize: '9px', color: '#ffffff' };
const FONT_MONEY = { fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: '#ffd166' };
const FONT_STAMINA = { fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: '#06d6a0' };

interface HotbarSlotUI {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Image;
  highlight: Phaser.GameObjects.Image;
  icon: Phaser.GameObjects.Image;
  numText: Phaser.GameObjects.Text;
  countText: Phaser.GameObjects.Text;
}

interface InvSlotUI {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Image;
  highlight: Phaser.GameObjects.Image;
  icon: Phaser.GameObjects.Image;
  countText: Phaser.GameObjects.Text;
  slotIndex: number;
}

export class HUD {
  private scene: Phaser.Scene;

  // Bottom-right HUD info box
  private hudContainer!: Phaser.GameObjects.Container;
  private timeText!: Phaser.GameObjects.Text;
  private dateText!: Phaser.GameObjects.Text;
  private moneyText!: Phaser.GameObjects.Text;
  private staminaText!: Phaser.GameObjects.Text;

  // Hotbar UI (Bottom-Left)
  private hotbarContainer!: Phaser.GameObjects.Container;
  private hotbarSlots: HotbarSlotUI[] = [];
  private activeItemText!: Phaser.GameObjects.Text;
  private activeSlotIndex = 0;
  private currentInventorySlots: readonly InventorySlot[] = [];

  // Inventory Modal
  private inventoryModalContainer!: Phaser.GameObjects.Container;
  private invSlotsUI: InvSlotUI[] = [];
  private invDetailName!: Phaser.GameObjects.Text;
  private invDetailCategory!: Phaser.GameObjects.Text;
  private invDetailDesc!: Phaser.GameObjects.Text;
  private invDetailPrice!: Phaser.GameObjects.Text;
  private invDetailAction!: Phaser.GameObjects.Text;
  private selectedInvSlot = 0;
  private inventoryOpen = false;

  // Interact prompt
  private interactPrompt!: Phaser.GameObjects.Container;
  private interactLabel!: Phaser.GameObjects.Text;

  // Dialogue box
  private dialogueContainer!: Phaser.GameObjects.Container;
  private dialogueText!: Phaser.GameObjects.Text;
  private dialogueNameText!: Phaser.GameObjects.Text;
  private currentDialogue: string[] = [];
  private dialogueIndex = 0;
  private dialogueActive = false;

  // Transition overlay
  private overlay!: Phaser.GameObjects.Image;

  // Notification banner
  private notifContainer!: Phaser.GameObjects.Container;
  private notifText!: Phaser.GameObjects.Text;
  private notifTween: Phaser.Tweens.Tween | null = null;

  /** Callback when a hotbar or inventory slot is selected by the user. */
  onSelectSlot?: (slotIndex: number) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createHUDBar();
    this.createHotbar();
    this.createInventoryModal();
    this.createInteractPrompt();
    this.createDialogueBox();
    this.createOverlay();
    this.createNotification();
    this.listenToEvents();
  }

  // ─── Creation ──────────────────────────────────────────────────────────────

  private createHUDBar(): void {
    const boxW = 148;
    const boxH = 74;
    const boxX = GAME_WIDTH - boxW - 8;
    const boxY = GAME_HEIGHT - boxH - 8;

    // Background panel
    const bg = this.scene.add.image(0, 0, 'hud_box').setOrigin(0, 0);

    // Date (Season, Day, Year) — Row 1
    this.dateText = this.scene.add
      .text(10, 12, 'Spring 1  Y1', FONT_DATE)
      .setOrigin(0, 0.5);

    // Time — Row 2
    this.timeText = this.scene.add
      .text(10, 28, '06:00', FONT_TIME)
      .setOrigin(0, 0.5);

    // Money — Row 3
    this.moneyText = this.scene.add
      .text(10, 44, '500G', FONT_MONEY)
      .setOrigin(0, 0.5);

    // Stamina — Row 4
    this.staminaText = this.scene.add
      .text(10, 60, 'ST:100', FONT_STAMINA)
      .setOrigin(0, 0.5);

    this.hudContainer = this.scene.add.container(boxX, boxY, [
      bg,
      this.dateText,
      this.timeText,
      this.moneyText,
      this.staminaText,
    ]);
    this.hudContainer.setDepth(100);
  }

  private createHotbar(): void {
    const slotCount = 6;
    const slotSize = 34;
    const spacing = 4;
    const startX = 10;
    const startY = GAME_HEIGHT - slotSize - 8;

    this.hotbarSlots = [];
    const containerChildren: Phaser.GameObjects.GameObject[] = [];

    // Active tool / item title label
    this.activeItemText = this.scene.add
      .text(0, -14, 'Empty Hand', { ...FONT_SM, color: '#ffeaa7' })
      .setOrigin(0, 0.5);
    containerChildren.push(this.activeItemText);

    for (let i = 0; i < slotCount; i++) {
      const slotX = i * (slotSize + spacing);
      const slotY = 0;

      const bg = this.scene.add
        .image(slotX, slotY, 'inv_slot_bg')
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true });

      const highlight = this.scene.add
        .image(slotX, slotY, 'inv_slot_selected')
        .setOrigin(0, 0)
        .setVisible(i === 0);

      const numText = this.scene.add
        .text(slotX + 3, slotY + 2, `${i + 1}`, FONT_XS)
        .setColor('#8899aa')
        .setOrigin(0, 0);

      const icon = this.scene.add
        .image(slotX + slotSize / 2, slotY + slotSize / 2, 'icon_hoe')
        .setOrigin(0.5, 0.5)
        .setVisible(false);

      const countText = this.scene.add
        .text(slotX + slotSize - 3, slotY + slotSize - 2, '', FONT_XS)
        .setColor('#ffffff')
        .setOrigin(1, 1);

      bg.on('pointerdown', () => {
        this.onSelectSlot?.(i);
      });

      this.hotbarSlots.push({
        container: null as unknown as Phaser.GameObjects.Container,
        bg,
        highlight,
        icon,
        numText,
        countText,
      });

      containerChildren.push(bg, highlight, numText, icon, countText);
    }

    // Quick Bag button [I]
    const bagBtnX = slotCount * (slotSize + spacing) + 4;
    const bagBg = this.scene.add
      .image(bagBtnX, 0, 'inv_slot_bg')
      .setOrigin(0, 0)
      .setInteractive({ useHandCursor: true });
    const bagLabel = this.scene.add
      .text(bagBtnX + slotSize / 2, slotSize / 2, 'Bag\n[I]', FONT_XS)
      .setAlign('center')
      .setColor('#90e0ef')
      .setOrigin(0.5, 0.5);

    bagBg.on('pointerdown', () => {
      this.toggleInventory();
    });

    containerChildren.push(bagBg, bagLabel);

    this.hotbarContainer = this.scene.add.container(startX, startY, containerChildren);
    this.hotbarContainer.setDepth(100);
  }

  private createInventoryModal(): void {
    const modalW = 460;
    const modalH = 240;
    const modalX = (GAME_WIDTH - modalW) / 2;
    const modalY = (GAME_HEIGHT - modalH) / 2;

    const bg = this.scene.add.image(0, 0, 'inventory_modal_bg').setOrigin(0, 0);

    // Title
    const title = this.scene.add
      .text(14, 9, 'INVENTORY BAG  [I/B/Esc to Close]', { ...FONT, color: '#f1faee' })
      .setOrigin(0, 0);

    // Close [X] button
    const closeBtn = this.scene.add
      .text(modalW - 20, 9, 'X', { ...FONT, color: '#ff6b6b' })
      .setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.closeInventory());

    const modalChildren: Phaser.GameObjects.GameObject[] = [bg, title, closeBtn];

    // Grid of 24 slots (6 columns × 4 rows)
    const cols = 6;
    const rows = 4;
    const slotSize = 34;
    const spacing = 4;
    const gridStartX = 16;
    const gridStartY = 42;

    this.invSlotsUI = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const slotIdx = r * cols + c;
        const sx = gridStartX + c * (slotSize + spacing);
        const sy = gridStartY + r * (slotSize + spacing);

        const slotBg = this.scene.add
          .image(sx, sy, 'inv_slot_bg')
          .setOrigin(0, 0)
          .setInteractive({ useHandCursor: true });

        const slotHighlight = this.scene.add
          .image(sx, sy, 'inv_slot_selected')
          .setOrigin(0, 0)
          .setVisible(false);

        const icon = this.scene.add
          .image(sx + slotSize / 2, sy + slotSize / 2, 'icon_hoe')
          .setOrigin(0.5, 0.5)
          .setVisible(false);

        const countText = this.scene.add
          .text(sx + slotSize - 3, sy + slotSize - 2, '', FONT_XS)
          .setColor('#ffffff')
          .setOrigin(1, 1);

        // Slot number label for first 6 (hotbar slots)
        if (slotIdx < 6) {
          const hotbarNum = this.scene.add
            .text(sx + 3, sy + 2, `${slotIdx + 1}`, FONT_XS)
            .setColor('#778da9')
            .setOrigin(0, 0);
          modalChildren.push(hotbarNum);
        }

        slotBg.on('pointerdown', () => {
          this.selectInvSlot(slotIdx);
        });

        this.invSlotsUI.push({
          container: null as unknown as Phaser.GameObjects.Container,
          bg: slotBg,
          highlight: slotHighlight,
          icon,
          countText,
          slotIndex: slotIdx,
        });

        modalChildren.push(slotBg, slotHighlight, icon, countText);
      }
    }

    // Detail panel on right side
    const detailX = 256;
    const detailY = 44;

    const detailBg = this.scene.add.graphics();
    detailBg.fillStyle(0x141b2b, 0.95);
    detailBg.fillRoundedRect(detailX, detailY, 190, 180, 6);
    detailBg.lineStyle(1, 0x3d4a63, 0.8);
    detailBg.strokeRoundedRect(detailX, detailY, 190, 180, 6);
    modalChildren.push(detailBg);

    this.invDetailName = this.scene.add
      .text(detailX + 10, detailY + 12, 'Empty Slot', { ...FONT, color: '#ffd166' })
      .setOrigin(0, 0);

    this.invDetailCategory = this.scene.add
      .text(detailX + 10, detailY + 28, '', { ...FONT_XS, color: '#90e0ef' })
      .setOrigin(0, 0);

    this.invDetailDesc = this.scene.add
      .text(detailX + 10, detailY + 44, 'Select an item to view details or hold/equip it.', {
        ...FONT_XS,
        color: '#ccddee',
        wordWrap: { width: 170 },
      })
      .setOrigin(0, 0);

    this.invDetailPrice = this.scene.add
      .text(detailX + 10, detailY + 120, '', { ...FONT_XS, color: '#06d6a0' })
      .setOrigin(0, 0);

    this.invDetailAction = this.scene.add
      .text(detailX + 10, detailY + 152, '[Click to Hold/Equip]', { ...FONT_XS, color: '#f4a261' })
      .setOrigin(0, 0);

    modalChildren.push(
      this.invDetailName,
      this.invDetailCategory,
      this.invDetailDesc,
      this.invDetailPrice,
      this.invDetailAction
    );

    this.inventoryModalContainer = this.scene.add.container(modalX, modalY, modalChildren);
    this.inventoryModalContainer.setDepth(250);
    this.inventoryModalContainer.setVisible(false);
  }

  private selectInvSlot(slotIdx: number): void {
    this.selectedInvSlot = slotIdx;
    for (let i = 0; i < this.invSlotsUI.length; i++) {
      const slotUI = this.invSlotsUI[i];
      if (slotUI) {
        slotUI.highlight.setVisible(i === slotIdx);
      }
    }

    const slot = this.currentInventorySlots[slotIdx];
    if (!slot) {
      this.invDetailName.setText('Empty Slot');
      this.invDetailCategory.setText('');
      this.invDetailDesc.setText('No item in this slot.');
      this.invDetailPrice.setText('');
      this.invDetailAction.setText('');
      if (slotIdx < 6) {
        this.onSelectSlot?.(slotIdx);
      }
      return;
    }

    const def = getItemDefinition(slot.itemId);
    const itemName = def?.name ?? slot.itemId.replace(/_/g, ' ');
    const category = def ? `Type: ${def.category.toUpperCase()}` : '';
    const desc = def?.description ?? '';
    const price = def?.sellPrice ? `Sell Price: ${def.sellPrice}G` : 'Cannot be sold';

    this.invDetailName.setText(itemName);
    this.invDetailCategory.setText(category);
    this.invDetailDesc.setText(desc);
    this.invDetailPrice.setText(price);
    this.invDetailAction.setText(slotIdx < 6 ? `[Hotbar #${slotIdx + 1} Equipped]` : `[Click #1-6 to place on Hotbar]`);

    if (slotIdx < 6) {
      this.onSelectSlot?.(slotIdx);
    }
  }

  private createInteractPrompt(): void {
    const bg = this.scene.add.image(0, 0, 'interact_prompt').setOrigin(0.5, 0.5);
    this.interactLabel = this.scene.add
      .text(0, 0, '[Space]', FONT_SM)
      .setOrigin(0.5, 0.5);

    this.interactPrompt = this.scene.add.container(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 30,
      [bg, this.interactLabel]
    );
    this.interactPrompt.setDepth(102);
    this.interactPrompt.setVisible(false);
  }

  private createDialogueBox(): void {
    const bg = this.scene.add.image(0, 0, 'dialogue_box').setOrigin(0, 0);
    this.dialogueNameText = this.scene.add
      .text(10, 8, '', { ...FONT, color: '#aaccff' })
      .setOrigin(0, 0);
    this.dialogueText = this.scene.add
      .text(10, 26, '', { ...FONT_SM, wordWrap: { width: 420 } })
      .setOrigin(0, 0);

    const arrow = this.scene.add
      .text(430, 90, '▼', FONT_SM)
      .setOrigin(1, 1)
      .setAlpha(0.7);
    this.scene.tweens.add({
      targets: arrow,
      alpha: 0.2,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.dialogueContainer = this.scene.add.container(
      (GAME_WIDTH - 440) / 2,
      GAME_HEIGHT - 110,
      [bg, this.dialogueNameText, this.dialogueText, arrow]
    );
    this.dialogueContainer.setDepth(200);
    this.dialogueContainer.setVisible(false);
  }

  private createOverlay(): void {
    this.overlay = this.scene.add.image(0, 0, 'black_overlay').setOrigin(0, 0);
    this.overlay.setDepth(300);
    this.overlay.setAlpha(0);
  }

  private createNotification(): void {
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a2a1a, 0.9);
    bg.fillRoundedRect(0, 0, 280, 26, 4);
    bg.lineStyle(1, 0x5a8a3a, 0.8);
    bg.strokeRoundedRect(0, 0, 280, 26, 4);

    this.notifText = this.scene.add
      .text(140, 13, '', { ...FONT_SM, color: '#aaffaa' })
      .setOrigin(0.5, 0.5);

    this.notifContainer = this.scene.add.container(
      GAME_WIDTH / 2 - 140,
      44,
      [bg, this.notifText]
    );
    this.notifContainer.setDepth(150);
    this.notifContainer.setAlpha(0);
  }

  // ─── Event listeners ───────────────────────────────────────────────────────

  private listenToEvents(): void {
    gameEvents.on('TIME_CHANGED', ({ hour, minute }) => {
      const h = String(hour).padStart(2, '0');
      const m = String(minute).padStart(2, '0');
      this.timeText.setText(`${h}:${m}`);
    });

    gameEvents.on('DAY_STARTED', ({ day, season, year }) => {
      const seasonName = season.charAt(0) + season.slice(1).toLowerCase();
      this.dateText.setText(`${seasonName} ${day}  Y${year}`);
    });

    gameEvents.on('PLAYER_MONEY_CHANGED', ({ newTotal }) => {
      this.moneyText.setText(`${newTotal}G`);
    });

    gameEvents.on('PLAYER_STAMINA_CHANGED', ({ newTotal }) => {
      this.staminaText.setText(`ST:${newTotal}`);
    });

    gameEvents.on('INTERACTION_STARTED', ({ label }) => {
      this.showInteractPrompt(label);
    });

    gameEvents.on('INTERACTION_ENDED', () => {
      this.hideInteractPrompt();
    });

    gameEvents.on('ITEM_ADDED', ({ itemId, quantity }) => {
      this.showNotification(`+${quantity} ${itemId.replace(/_/g, ' ')}`);
    });

    gameEvents.on('GAME_SAVED', () => {
      this.showNotification('Game Saved!');
    });
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  init(state: { time: GameTime; player: PlayerState; inventorySlots?: readonly InventorySlot[] }): void {
    const { time, player, inventorySlots } = state;
    const seasonName = time.season.charAt(0) + time.season.slice(1).toLowerCase();
    this.dateText.setText(`${seasonName} ${time.day}  Y${time.year}`);
    const h = String(time.hour).padStart(2, '0');
    const m = String(time.minute).padStart(2, '0');
    this.timeText.setText(`${h}:${m}`);
    this.moneyText.setText(`${player.money}G`);
    this.staminaText.setText(`ST:${player.stamina}`);

    if (inventorySlots) {
      this.updateHotbar(inventorySlots, player.activeToolSlot ?? 0);
    }
  }

  /** Update hotbar rendering with latest inventory state. */
  updateHotbar(slots: readonly InventorySlot[], activeSlot: number): void {
    this.currentInventorySlots = slots;
    this.activeSlotIndex = activeSlot;

    for (let i = 0; i < this.hotbarSlots.length; i++) {
      const slotUI = this.hotbarSlots[i];
      if (!slotUI) continue;

      slotUI.highlight.setVisible(i === activeSlot);

      const slot = slots[i];
      if (slot && slot.quantity > 0) {
        const textureKey = `icon_${slot.itemId}`;
        if (this.scene.textures.exists(textureKey)) {
          slotUI.icon.setTexture(textureKey).setVisible(true);
        } else {
          slotUI.icon.setVisible(false);
        }
        slotUI.countText.setText(slot.quantity > 1 ? `x${slot.quantity}` : '');
      } else {
        slotUI.icon.setVisible(false);
        slotUI.countText.setText('');
      }
    }

    const activeItem = slots[activeSlot];
    if (activeItem) {
      const def = getItemDefinition(activeItem.itemId);
      const name = def?.name ?? activeItem.itemId.replace(/_/g, ' ');
      const qtyStr = activeItem.quantity > 1 ? ` (x${activeItem.quantity})` : '';
      this.activeItemText.setText(`[${activeSlot + 1}] ${name}${qtyStr}`);
    } else {
      this.activeItemText.setText(`[${activeSlot + 1}] Empty Hand`);
    }

    if (this.inventoryOpen) {
      this.updateInventoryModal(slots);
    }
  }

  /** Update full inventory modal slots. */
  updateInventoryModal(slots: readonly InventorySlot[]): void {
    this.currentInventorySlots = slots;
    for (let i = 0; i < this.invSlotsUI.length; i++) {
      const slotUI = this.invSlotsUI[i];
      if (!slotUI) continue;

      slotUI.highlight.setVisible(i === this.selectedInvSlot);

      const slot = slots[i];
      if (slot && slot.quantity > 0) {
        const textureKey = `icon_${slot.itemId}`;
        if (this.scene.textures.exists(textureKey)) {
          slotUI.icon.setTexture(textureKey).setVisible(true);
        } else {
          slotUI.icon.setVisible(false);
        }
        slotUI.countText.setText(slot.quantity > 1 ? `x${slot.quantity}` : '');
      } else {
        slotUI.icon.setVisible(false);
        slotUI.countText.setText('');
      }
    }
  }

  toggleInventory(slots?: readonly InventorySlot[]): boolean {
    if (this.inventoryOpen) {
      this.closeInventory();
    } else {
      this.openInventory(slots);
    }
    return this.inventoryOpen;
  }

  openInventory(slots?: readonly InventorySlot[]): void {
    if (slots) this.currentInventorySlots = slots;
    this.inventoryOpen = true;
    this.inventoryModalContainer.setVisible(true);
    this.updateInventoryModal(this.currentInventorySlots);
    this.selectInvSlot(this.activeSlotIndex);
  }

  closeInventory(): void {
    this.inventoryOpen = false;
    this.inventoryModalContainer.setVisible(false);
  }

  isInventoryOpen(): boolean {
    return this.inventoryOpen;
  }

  showInteractPrompt(label: string): void {
    this.interactLabel.setText(`[Space] ${label}`);
    this.interactPrompt.setVisible(true);
  }

  hideInteractPrompt(): void {
    this.interactPrompt.setVisible(false);
  }

  /** Start displaying a dialogue sequence. */
  showDialogue(speakerName: string, lines: string[], onComplete?: () => void): void {
    this.currentDialogue = lines;
    this.dialogueIndex = 0;
    this.dialogueActive = true;
    this.dialogueNameText.setText(speakerName);
    this.dialogueContainer.setVisible(true);
    this.hideInteractPrompt();
    this.advanceDialogue(onComplete);
  }

  private advanceDialogue(onComplete?: () => void): void {
    if (this.dialogueIndex >= this.currentDialogue.length) {
      this.closeDialogue();
      onComplete?.();
      return;
    }
    const line = this.currentDialogue[this.dialogueIndex] ?? '';
    this.dialogueText.setText(line);
    this.dialogueIndex++;
  }

  /** Call on interact key press to advance dialogue. Returns true if dialogue was active. */
  tryAdvanceDialogue(onComplete?: () => void): boolean {
    if (!this.dialogueActive) return false;
    this.advanceDialogue(onComplete);
    return true;
  }

  closeDialogue(): void {
    this.dialogueActive = false;
    this.dialogueContainer.setVisible(false);
  }

  isDialogueActive(): boolean {
    return this.dialogueActive;
  }

  showNotification(message: string): void {
    this.notifText.setText(message);

    if (this.notifTween) {
      this.notifTween.stop();
    }

    this.notifContainer.setAlpha(1);
    this.notifTween = this.scene.tweens.add({
      targets: this.notifContainer,
      alpha: 0,
      delay: 2000,
      duration: 500,
    });
  }

  /** Flash black overlay for scene transitions. */
  fadeOut(onComplete?: () => void): void {
    this.scene.tweens.killTweensOf(this.overlay);
    this.scene.tweens.add({
      targets: this.overlay,
      alpha: 1,
      duration: 300,
      onComplete: () => onComplete?.(),
    });
  }

  fadeIn(onComplete?: () => void): void {
    this.scene.tweens.killTweensOf(this.overlay);
    this.scene.tweens.add({
      targets: this.overlay,
      alpha: 0,
      duration: 300,
      onComplete: () => onComplete?.(),
    });
  }
}
