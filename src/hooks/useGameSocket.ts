import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ServerGame } from '../types/ServerGame';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL;

export interface RematchEvents {
  onRematchRequested?: (data: { requestingPlayer: string }) => void;
  onRematchDeclined?: (data: { decliningPlayer: string }) => void;
  onRematchReady?: (data: { newGameId: string }) => void;
}

export function useGameSocket(
  gameId: string,
  onGameUpdate: (gameData: ServerGame) => void,
  rematchEvents?: RematchEvents
) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to the socket server
    const socket: Socket = io(SOCKET_URL, {
      transports: ['websocket'],
      withCredentials: true,
    });
    socketRef.current = socket;

    // Join the game room
    socket.emit('joinGame', gameId);

    // Listen for game updates
    socket.on('gameUpdated', (gameData) => {
      onGameUpdate(gameData);
    });

    // Rematch events
    if (rematchEvents?.onRematchRequested) {
      socket.on('rematchRequested', rematchEvents.onRematchRequested);
    }
    if (rematchEvents?.onRematchDeclined) {
      socket.on('rematchDeclined', rematchEvents.onRematchDeclined);
    }
    if (rematchEvents?.onRematchReady) {
      socket.on('rematchReady', rematchEvents.onRematchReady);
    }

    // Cleanup on unmount
    return () => {
      socket.emit('leaveGame', gameId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [gameId, onGameUpdate, rematchEvents]);

  return socketRef;
}
