/**
 * FarmingSystem — manages farm plots and crop lifecycle.
 *
 * Pure domain logic; no Phaser dependencies.
 * Operates on the FarmState model and emits events.
 *
 * Architecture:
 *   GameState.farm → FarmingSystem → events → Phaser visuals
 *   NOT: Phaser sprite → everything
 */

import type { FarmState, FarmPlotData } from '../types/GameState';
import type { CropState } from '../types/Crop';
import type { GameTime } from '../types/GameTime';
import { getCropDefinition, getCropBySeedItemId } from '../data/crops/cropDefinitions';
import { gameEvents } from '../managers/EventManager';

let cropIdCounter = 0;
function generateCropId(): string {
  return `crop_${++cropIdCounter}`;
}

export class FarmingSystem {
  private state: FarmState;

  constructor(initialState?: FarmState) {
    this.state = initialState ?? { plots: {}, crops: {} };
  }

  getState(): Readonly<FarmState> {
    return this.state;
  }

  getPlot(plotKey: string): FarmPlotData | undefined {
    return this.state.plots[plotKey];
  }

  getCrop(cropId: string): CropState | undefined {
    return this.state.crops[cropId];
  }

  getCropAtPlot(plotKey: string): CropState | undefined {
    const plot = this.state.plots[plotKey];
    if (!plot?.cropId) return undefined;
    return this.state.crops[plot.cropId];
  }

  /** Till a soil tile. Returns false if not valid or already tilled. */
  tillSoil(plotKey: string): boolean {
    const existing = this.state.plots[plotKey];
    if (existing?.tilled) return false;

    this.state.plots[plotKey] = {
      key: plotKey,
      tilled: true,
      watered: false,
    };

    gameEvents.emit('SOIL_TILLED', { plotKey });
    return true;
    }

  /**
   * Plant a seed on a tilled plot.
   * @param seedItemId - the item id of the seed (e.g., 'turnip_seed')
   * @returns true on success
   */
  plantSeed(plotKey: string, seedItemId: string): boolean {
    const plot = this.state.plots[plotKey];
    if (!plot?.tilled || plot.cropId) return false;

    const definition = getCropBySeedItemId(seedItemId);
    if (!definition) {
      console.warn(`FarmingSystem: No crop definition for seed "${seedItemId}"`);
      return false;
    }

    const cropId = generateCropId();
    const crop: CropState = {
      id: cropId,
      definitionId: definition.id,
      plotKey,
      planted: true,
      watered: false,
      growthProgress: 0,
      stage: 'seed',
      harvestable: false,
      dead: false,
    };

    this.state.crops[cropId] = crop;
    this.state.plots[plotKey]!.cropId = cropId;

    gameEvents.emit('CROP_PLANTED', { plotKey, cropId, definitionId: definition.id });
    return true;
  }

  /** Water a crop on a plot. Returns false if no tilled plot or already watered. */
  waterPlot(plotKey: string): boolean {
    const plot = this.state.plots[plotKey];
    if (!plot?.tilled || plot.watered) return false;

    plot.watered = true;

    const crop = plot.cropId ? this.state.crops[plot.cropId] : undefined;
    if (crop && !crop.dead) {
      crop.watered = true;
      gameEvents.emit('CROP_WATERED', { plotKey, cropId: crop.id });
    }

    return true;
  }

  /**
   * Advance crop growth by one day.
   * Called by TimeSystem's DAY_STARTED event.
   */
  advanceDay(currentTime: GameTime): void {
    for (const cropId in this.state.crops) {
      const crop = this.state.crops[cropId];
      if (!crop || crop.dead || crop.harvestable) continue;

      const definition = getCropDefinition(crop.definitionId);
      if (!definition) continue;

      // Check season compatibility
      if (!definition.seasons.includes(currentTime.season)) {
        crop.dead = true;
        crop.stage = 'dead';
        gameEvents.emit('CROP_DIED', { plotKey: crop.plotKey, cropId });
        continue;
      }

      // Only grow if watered
      if (crop.watered) {
        crop.growthProgress += 1;
        crop.watered = false; // watering resets daily
      }

      // Update visual stage
      crop.stage = this.calculateStage(crop.growthProgress, definition.growthDays);

      // Check if mature
      if (crop.growthProgress >= definition.growthDays) {
        crop.harvestable = true;
        crop.stage = 'mature';
        gameEvents.emit('CROP_GROWN', {
          plotKey: crop.plotKey,
          cropId,
          definitionId: crop.definitionId,
        });
      }
    }

    // Reset plot watering
    for (const plotKey in this.state.plots) {
      const plot = this.state.plots[plotKey];
      if (plot) plot.watered = false;
    }
  }

  /**
   * Harvest a mature crop.
   * @returns the harvested item id or null if not harvestable
   */
  harvestCrop(plotKey: string): string | null {
    const plot = this.state.plots[plotKey];
    if (!plot?.cropId) return null;

    const crop = this.state.crops[plot.cropId];
    if (!crop?.harvestable) return null;

    const definition = getCropDefinition(crop.definitionId);
    if (!definition) return null;

    const harvestedItemId = crop.definitionId; // crop id matches item id

    gameEvents.emit('CROP_HARVESTED', {
      plotKey,
      cropId: crop.id,
      definitionId: crop.definitionId,
    });

    if (definition.regrow) {
      // Reset crop for regrowth
      crop.growthProgress = 0;
      crop.harvestable = false;
      crop.stage = 'growing';
      crop.watered = false;
    } else {
      // Remove crop and untill the plot (keeps it tilled)
      delete this.state.crops[plot.cropId];
      delete this.state.plots[plotKey]?.cropId;
    }

    return harvestedItemId;
  }

  /** Restore farming state from save. */
  restoreFromState(savedState: FarmState): void {
    this.state = {
      plots: { ...savedState.plots },
      crops: { ...savedState.crops },
    };
  }

  private calculateStage(
    progress: number,
    totalDays: number
  ): 'seed' | 'sprout' | 'growing' | 'mature' | 'dead' {
    const ratio = progress / totalDays;
    if (ratio <= 0) return 'seed';
    if (ratio < 0.25) return 'sprout';
    if (ratio < 1) return 'growing';
    return 'mature';
  }
}
