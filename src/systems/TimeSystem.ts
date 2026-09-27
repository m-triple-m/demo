/**
 * TimeSystem — manages the in-game clock and calendar.
 *
 * Decoupled from Phaser; uses real elapsed time to advance the game clock.
 * Emits events so other systems can react to time changes without polling.
 */

import {
  Season,
  DAYS_PER_SEASON,
  SEASONS_PER_YEAR,
  MS_PER_GAME_MINUTE,
  GAME_START_HOUR,
  HOURS_PER_DAY,
  MINUTES_PER_HOUR,
} from '../types/GameTime';
import type { GameTime } from '../types/GameTime';
import { gameEvents } from '../managers/EventManager';

const SEASON_ORDER: Season[] = [Season.SPRING, Season.SUMMER, Season.AUTUMN, Season.WINTER];

export class TimeSystem {
  private time: GameTime;
  private accumulatedMs = 0;
  private paused = false;

  constructor(initialTime?: Partial<GameTime>) {
    this.time = {
      year: 1,
      season: Season.SPRING,
      day: 1,
      hour: GAME_START_HOUR,
      minute: 0,
      ...initialTime,
    };
  }

  getTime(): Readonly<GameTime> {
    return { ...this.time };
  }

  /** Called from the game scene's update loop with delta in ms. */
  update(deltaMs: number): void {
    if (this.paused) return;

    this.accumulatedMs += deltaMs;

    while (this.accumulatedMs >= MS_PER_GAME_MINUTE) {
      this.accumulatedMs -= MS_PER_GAME_MINUTE;
      this.advanceMinute();
    }
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  isPaused(): boolean {
    return this.paused;
  }

  private advanceMinute(): void {
    this.time.minute += 1;

    if (this.time.minute >= MINUTES_PER_HOUR) {
      this.time.minute = 0;
      this.time.hour += 1;

      if (this.time.hour >= HOURS_PER_DAY) {
        // Auto-advance to next day at midnight
        this.advanceDay();
        return;
      }
    }

    gameEvents.emit('TIME_CHANGED', { hour: this.time.hour, minute: this.time.minute });
  }

  /** Advance to the next in-game day. Call explicitly for sleep. */
  advanceDay(): void {
    const oldSeason = this.time.season;
    const oldYear = this.time.year;

    gameEvents.emit('DAY_ENDED', {
      day: this.time.day,
      season: this.time.season,
      year: this.time.year,
    });

    this.time.day += 1;

    if (this.time.day > DAYS_PER_SEASON) {
      this.time.day = 1;
      const currentSeasonIndex = SEASON_ORDER.indexOf(this.time.season);
      const nextSeasonIndex = (currentSeasonIndex + 1) % SEASONS_PER_YEAR;
      this.time.season = SEASON_ORDER[nextSeasonIndex] ?? Season.SPRING;

      if (this.time.season === Season.SPRING) {
        this.time.year += 1;
      }
    }

    // Reset clock to morning
    this.time.hour = GAME_START_HOUR;
    this.time.minute = 0;

    if (this.time.season !== oldSeason) {
      gameEvents.emit('SEASON_CHANGED', { season: this.time.season });
    }
    if (this.time.year !== oldYear) {
      gameEvents.emit('YEAR_CHANGED', { year: this.time.year });
    }

    gameEvents.emit('DAY_STARTED', {
      day: this.time.day,
      season: this.time.season,
      year: this.time.year,
    });
    gameEvents.emit('TIME_CHANGED', { hour: this.time.hour, minute: this.time.minute });
  }

  /** Called when player sleeps — advances the day immediately. */
  sleep(): void {
    this.pause();
    this.advanceDay();
  }

  /** Restore time from saved state. */
  restoreFromState(savedTime: GameTime): void {
    this.time = { ...savedTime };
  }

  getFormattedTime(): string {
    const h = String(this.time.hour).padStart(2, '0');
    const m = String(this.time.minute).padStart(2, '0');
    return `${h}:${m}`;
  }

  getSeasonName(): string {
    const names: Record<Season, string> = {
      [Season.SPRING]: 'Spring',
      [Season.SUMMER]: 'Summer',
      [Season.AUTUMN]: 'Autumn',
      [Season.WINTER]: 'Winter',
    };
    return names[this.time.season];
  }
}
