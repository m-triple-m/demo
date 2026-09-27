/**
 * NPC definitions — stub for future NPC system.
 */

export interface NPCDefinition {
  id: string;
  name: string;
  location: string;
  schedule: Record<string, { x: number; y: number }>;
}

export const NPC_DEFINITIONS: Readonly<Record<string, NPCDefinition>> = {
  mayor: {
    id: 'mayor',
    name: 'Mayor Thomas',
    location: 'town',
    schedule: {
      morning: { x: 5, y: 3 },
      afternoon: { x: 8, y: 5 },
    },
  },
  shopkeeper: {
    id: 'shopkeeper',
    name: 'Ellen',
    location: 'town',
    schedule: {
      morning: { x: 3, y: 4 },
      afternoon: { x: 3, y: 4 },
    },
  },
};
