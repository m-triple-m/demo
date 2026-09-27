/**
 * Core game time types.
 * Represents the in-game calendar and clock.
 */

export enum Season {
  SPRING = 'SPRING',
  SUMMER = 'SUMMER',
  AUTUMN = 'AUTUMN',
  WINTER = 'WINTER',
}

export interface GameTime {
  year: number;
  season: Season;
  day: number;
  hour: number;
  minute: number;
}

export const DAYS_PER_SEASON = 28;
export const SEASONS_PER_YEAR = 4;
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;
export const GAME_START_HOUR = 6;
export const SLEEP_HOUR = 24; // midnight = end of day

/** Real milliseconds per in-game minute. */
export const MS_PER_GAME_MINUTE = 1000;
