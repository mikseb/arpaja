export interface Player {
  name: string;
  currentNumber: number;
  wins: number;
}

export type RoundState = "PICK_TICKET" | "DRAW_WINNER" | "WINNER_ANNOUNCED";

export interface LastWinner {
  name: string;
  number: number;
}

export interface GameState {
  players: Player[];
  state: RoundState;
  numbersLeft: number;
  lastWinner: LastWinner;
  infoText: string;
}
