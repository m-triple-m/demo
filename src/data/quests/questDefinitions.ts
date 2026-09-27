/**
 * Quest definitions — stub for future quest system.
 */

export type QuestStatus = 'inactive' | 'active' | 'completed' | 'failed';

export interface QuestObjective {
  id: string;
  description: string;
  type: 'deliver' | 'harvest' | 'talk' | 'reach';
  targetId: string;
  quantity: number;
  currentQuantity: number;
}

export interface QuestDefinition {
  id: string;
  name: string;
  description: string;
  objectives: QuestObjective[];
  rewardMoney: number;
  rewardItems: { itemId: string; quantity: number }[];
}

// Placeholder quest definitions to demonstrate the system
export const QUEST_DEFINITIONS: Readonly<Record<string, QuestDefinition>> = {
  first_harvest: {
    id: 'first_harvest',
    name: 'First Harvest',
    description: 'Grow and harvest your first turnip.',
    objectives: [
      {
        id: 'harvest_turnip',
        description: 'Harvest a Turnip',
        type: 'harvest',
        targetId: 'turnip',
        quantity: 1,
        currentQuantity: 0,
      },
    ],
    rewardMoney: 100,
    rewardItems: [],
  },
};
