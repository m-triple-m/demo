/**
 * Item definitions — data-driven.
 * All items in the game are registered here.
 */

import type { ItemDefinition } from '../../types/Item';

export const ITEM_DEFINITIONS: Readonly<Record<string, ItemDefinition>> = {
  // Seeds
  turnip_seed: {
    id: 'turnip_seed',
    name: 'Turnip Seed',
    description: 'Plant in spring. Grows in 5 days.',
    category: 'seed',
    stackable: true,
    maxStack: 99,
    sellPrice: 30,
    buyPrice: 60,
  },
  potato_seed: {
    id: 'potato_seed',
    name: 'Potato Seed',
    description: 'Plant in spring. Grows in 8 days.',
    category: 'seed',
    stackable: true,
    maxStack: 99,
    sellPrice: 40,
    buyPrice: 80,
  },
  tomato_seed: {
    id: 'tomato_seed',
    name: 'Tomato Seed',
    description: 'Plant in summer. Grows in 11 days, then regrows every 4 days.',
    category: 'seed',
    stackable: true,
    maxStack: 99,
    sellPrice: 25,
    buyPrice: 50,
  },

  // Crops
  turnip: {
    id: 'turnip',
    name: 'Turnip',
    description: 'A fresh turnip from the farm.',
    category: 'crop',
    stackable: true,
    maxStack: 99,
    sellPrice: 60,
  },
  potato: {
    id: 'potato',
    name: 'Potato',
    description: 'A hearty potato.',
    category: 'crop',
    stackable: true,
    maxStack: 99,
    sellPrice: 80,
  },
  tomato: {
    id: 'tomato',
    name: 'Tomato',
    description: 'A ripe tomato. The plant regrows after harvest.',
    category: 'crop',
    stackable: true,
    maxStack: 99,
    sellPrice: 60,
  },

  // Tools (stubs — for future tool system)
  hoe: {
    id: 'hoe',
    name: 'Hoe',
    description: 'Used to till the soil.',
    category: 'tool',
    stackable: false,
    maxStack: 1,
    sellPrice: 0,
  },
  watering_can: {
    id: 'watering_can',
    name: 'Watering Can',
    description: 'Used to water crops.',
    category: 'tool',
    stackable: false,
    maxStack: 1,
    sellPrice: 0,
  },
};

export function getItemDefinition(id: string): ItemDefinition | undefined {
  return ITEM_DEFINITIONS[id];
}
