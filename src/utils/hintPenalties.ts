/** Time penalties (seconds) applied when using hints — keeps scoring fair */
export const HINT_TIME_PENALTY_SECONDS = {
  letter: 5,
  famous: 5,
  flag: 10,
  capital: 10,
  player: 5,
  singer: 5,
} as const;

export type TimedHintType = keyof typeof HINT_TIME_PENALTY_SECONDS;

export function getHintTimePenaltySeconds(type: TimedHintType): number {
  return HINT_TIME_PENALTY_SECONDS[type];
}
