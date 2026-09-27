# 🌾 Farm Life

A Harvest Moon-inspired 2D top-down farming and life simulation game built with **Phaser 3**, **TypeScript**, and **Vite**.

---

## 🚀 Getting Started

```bash
npm install
npm run dev
```

The game runs at **http://localhost:3000** with hot-reload.

### Build for production

```bash
npm run build
npm run preview
```

---

## 🎮 Controls

| Key | Action |
|-----|--------|
| **Arrow Keys** | Move player |
| **Space** | Interact / Advance dialogue |
| **Z** | Sleep (advance to next day) |
| **Tab** | Cycle active tool |

### Interaction Context

Standing near a farm plot and pressing **Space** will:
- **Till** untilled soil
- **Plant** a seed (if you have one)
- **Water** an unwatered crop
- **Harvest** a mature crop

---

## 📁 Project Structure

```
src/
├── main.ts                  # Phaser game entry point
├── config/
│   └── gameConfig.ts        # Resolution, constants, scene keys
│
├── scenes/
│   ├── BootScene.ts         # Sets pixel-art render settings
│   ├── PreloadScene.ts      # Generates procedural assets
│   ├── MainMenuScene.ts     # Title screen
│   ├── GameScene.ts         # Main gameplay scene
│   └── UIScene.ts           # Parallel HUD scene
│
├── entities/
│   └── Player.ts            # Player sprite + movement + input
│
├── systems/                 # Pure domain logic — no Phaser
│   ├── TimeSystem.ts        # In-game clock and calendar
│   ├── FarmingSystem.ts     # Crop lifecycle management
│   ├── InventorySystem.ts   # Item management
│   └── SaveSystem.ts        # localStorage save/load
│
├── managers/
│   ├── EventManager.ts      # Type-safe event bus
│   └── AudioManager.ts      # Centralized audio control
│
├── data/                    # Data-driven content
│   ├── crops/               # Crop definitions (Turnip, Potato, Tomato)
│   ├── items/               # Item definitions
│   ├── npcs/                # NPC definitions
│   ├── dialogue/            # Dialogue trees
│   └── quests/              # Quest definitions
│
├── types/                   # TypeScript interfaces
│   ├── GameTime.ts          # GameTime, Season
│   ├── Crop.ts              # CropDefinition, CropState
│   ├── Item.ts              # ItemDefinition, InventoryState
│   ├── Player.ts            # PlayerState, Direction
│   ├── GameState.ts         # Central GameState (source of truth)
│   └── Interactable.ts      # Interactable interface
│
├── ui/
│   └── HUD.ts               # Heads-up display
│
└── utils/
    ├── AssetGenerator.ts    # Procedural pixel-art texture generator
    └── MapBuilder.ts        # Tilemap data + Phaser layer builder
```

---

## 🏗️ Architecture

### Data Flow

```
GameState (source of truth)
    ↓
Systems (FarmingSystem, TimeSystem, InventorySystem)
    ↓
EventManager (type-safe event bus)
    ↓
GameScene (visuals)    UIScene (HUD)
```

### Key Principles

- **Systems are pure domain logic** — no Phaser dependencies in `systems/`
- **Data-driven content** — adding a new crop means adding a definition in `data/crops/`; no engine changes
- **Events decouple systems** — NPCs, quests, achievements can subscribe to `CROP_HARVESTED`, `DAY_STARTED`, etc.
- **GameState is the source of truth** — sprites represent state, they don't own it
- **Save system is abstracted** — swap localStorage for IndexedDB or cloud by changing one file

---

## 🌱 Implemented Features (v0.1)

- [x] Phaser 3 + TypeScript + Vite project
- [x] GBA-inspired 320×180 resolution with sharp pixel scaling
- [x] Procedural pixel-art textures (no external assets needed)
- [x] Boot → Preload → MainMenu → Game scene flow
- [x] Farm map + Town map with collision
- [x] 4-direction player movement with walking animation
- [x] Camera follows player
- [x] In-game clock (6am–midnight, auto-advance)
- [x] Season system (Spring → Summer → Autumn → Winter)
- [x] Sleep (Z key) to advance day
- [x] Farm plot tilling, planting, watering, harvesting
- [x] 3 crops: Turnip (5 days), Potato (8 days), Tomato (11 days, regrows)
- [x] Inventory system with stacking
- [x] Shipping box (sell crops for money)
- [x] NPC placeholders with dialogue
- [x] Signs with dialogue
- [x] Map transitions (Farm ↔ Town via door portals)
- [x] HUD: Date, Time, Money, Stamina
- [x] Interact prompt system
- [x] Dialogue box
- [x] Notification system
- [x] Auto-save every 60 seconds + on day change
- [x] Save/Load via localStorage
- [x] Type-safe event bus
- [x] ESLint + Prettier configured

---

## 🗺️ Roadmap (Future Milestones)

### Milestone 2 — Content
- [ ] Real sprite sheet artwork
- [ ] Tiled-compatible .json tilemaps
- [ ] Tool upgrade system
- [ ] Item sell prices from definitions
- [ ] More crops per season

### Milestone 3 — NPCs
- [ ] NPC schedule system
- [ ] Full dialogue trees with choices
- [ ] Relationship system
- [ ] Gift giving

### Milestone 4 — World
- [ ] Mine area
- [ ] Fishing spots
- [ ] More maps (forest, beach)
- [ ] Weather system with visual effects

### Milestone 5 — Life Sim
- [ ] Animals (chicken, cow)
- [ ] Cooking system
- [ ] Festivals and calendar events
- [ ] Marriage system
- [ ] Quest system

### Milestone 6 — Polish
- [ ] Music and SFX
- [ ] Particle effects (subtle)
- [ ] Settings menu
- [ ] Mobile touch controls
- [ ] Cloud saves

---

## 🛠️ Development

### Adding a New Crop

1. Add definition to [`src/data/crops/cropDefinitions.ts`](src/data/crops/cropDefinitions.ts)
2. Add seed and crop item to [`src/data/items/itemDefinitions.ts`](src/data/items/itemDefinitions.ts)
3. Done — the engine handles the rest

### Adding a New NPC

1. Add definition to [`src/data/npcs/npcDefinitions.ts`](src/data/npcs/npcDefinitions.ts)
2. Add dialogue to [`src/data/dialogue/dialogueDefinitions.ts`](src/data/dialogue/dialogueDefinitions.ts)
3. Add to map objects in [`src/utils/MapBuilder.ts`](src/utils/MapBuilder.ts)

### Enabling Physics Debug

In [`src/main.ts`](src/main.ts), set `arcade.debug: true`.

### Replacing Procedural Assets with Real Sprites

In [`src/scenes/PreloadScene.ts`](src/scenes/PreloadScene.ts):
```ts
this.load.spritesheet('player', 'assets/player.png', { frameWidth: 16, frameHeight: 16 });
```
Then remove the `generateAssets(this)` call from `create()`.

---

## 📜 License

MIT
