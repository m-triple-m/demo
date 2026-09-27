/**
 * Item domain types.
 * Items are data-driven; adding a new item means adding a definition here.
 */

export type ItemCategory =
  | 'seed'
  | 'crop'
  | 'tool'
  | 'fish'
  | 'mineral'
  | 'food'
  | 'gift'
  | 'misc';

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  stackable: boolean;
  maxStack: number;
  sellPrice: number;
  buyPrice?: number;
}

export interface InventorySlot {
  itemId: string;
  quantity: number;
}

export interface InventoryState {
  slots: InventorySlot[];
  maxSlots: number;
}
