/**
 * InventorySystem — manages the player's inventory.
 *
 * Pure domain logic; no Phaser dependencies.
 * Emits events when items are added/removed.
 */

import type { InventorySlot, InventoryState } from '../types/Item';
import { getItemDefinition } from '../data/items/itemDefinitions';
import { gameEvents } from '../managers/EventManager';

export class InventorySystem {
  private state: InventoryState;

  constructor(initialState?: InventoryState) {
    this.state = initialState ?? {
      slots: [],
      maxSlots: 30,
    };
  }

  getState(): Readonly<InventoryState> {
    return { ...this.state, slots: [...this.state.slots] };
  }

  getSlots(): readonly InventorySlot[] {
    return this.state.slots;
  }

  /**
   * Add items to the inventory. Returns the number of items that couldn't fit.
   */
  addItem(itemId: string, quantity: number): number {
    const definition = getItemDefinition(itemId);
    if (!definition) {
      console.warn(`InventorySystem: Unknown item id "${itemId}"`);
      return quantity;
    }

    let remaining = quantity;

    if (definition.stackable) {
      // Try to fill existing stacks first
      for (const slot of this.state.slots) {
        if (slot.itemId === itemId && remaining > 0) {
          const space = definition.maxStack - slot.quantity;
          const toAdd = Math.min(space, remaining);
          slot.quantity += toAdd;
          remaining -= toAdd;
        }
      }
    }

    // Create new slots for remaining items
    while (remaining > 0 && this.state.slots.length < this.state.maxSlots) {
      const toAdd = definition.stackable ? Math.min(remaining, definition.maxStack) : 1;
      this.state.slots.push({ itemId, quantity: toAdd });
      remaining -= toAdd;
    }

    const added = quantity - remaining;
    if (added > 0) {
      gameEvents.emit('ITEM_ADDED', { itemId, quantity: added });
    }

    return remaining; // items that didn't fit
  }

  /**
   * Remove items from inventory. Returns true if successful.
   */
  removeItem(itemId: string, quantity: number): boolean {
    if (!this.hasItem(itemId, quantity)) return false;

    let remaining = quantity;
    this.state.slots = this.state.slots.filter((slot) => {
      if (slot.itemId !== itemId || remaining <= 0) return true;
      const toRemove = Math.min(slot.quantity, remaining);
      slot.quantity -= toRemove;
      remaining -= toRemove;
      return slot.quantity > 0;
    });

    gameEvents.emit('ITEM_REMOVED', { itemId, quantity });
    return true;
  }

  hasItem(itemId: string, quantity = 1): boolean {
    return this.getItemCount(itemId) >= quantity;
  }

  getItemCount(itemId: string): number {
    return this.state.slots
      .filter((s) => s.itemId === itemId)
      .reduce((sum, s) => sum + s.quantity, 0);
  }

  isFull(): boolean {
    return this.state.slots.length >= this.state.maxSlots;
  }

  /** Restore inventory from saved state. */
  restoreFromState(savedState: InventoryState): void {
    this.state = {
      slots: savedState.slots.map((s) => ({ ...s })),
      maxSlots: savedState.maxSlots,
    };
  }
}
