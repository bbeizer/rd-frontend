import { ServerGame } from "./ServerGame";
export type StartOrJoinMultiplayerResponse = {
    game: ServerGame;
    playerColor: 'white' | 'black';
    message: string;
  };
  