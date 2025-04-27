import { ServerGame } from './ServerGame';

export type StartSinglePlayerResponse = {
  game: ServerGame;
  message: string;
};
