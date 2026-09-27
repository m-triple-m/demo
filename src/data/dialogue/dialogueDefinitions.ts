/**
 * Dialogue definitions — stub for future dialogue system.
 */

export interface DialogueLine {
  speakerId: string;
  text: string;
}

export interface DialogueTree {
  id: string;
  lines: DialogueLine[];
}

export const DIALOGUE_DEFINITIONS: Readonly<Record<string, DialogueTree>> = {
  mayor_greeting: {
    id: 'mayor_greeting',
    lines: [
      { speakerId: 'mayor', text: 'Welcome to Maplewood Valley!' },
      { speakerId: 'mayor', text: 'I hope you enjoy farming here.' },
    ],
  },
  shopkeeper_greeting: {
    id: 'shopkeeper_greeting',
    lines: [
      { speakerId: 'shopkeeper', text: "Welcome to Ellen's General Store!" },
      { speakerId: 'shopkeeper', text: 'We carry the finest seeds in the valley.' },
    ],
  },
  sign_farm_entrance: {
    id: 'sign_farm_entrance',
    lines: [{ speakerId: 'sign', text: 'Your Farm — Work hard and prosper!' }],
  },
};
