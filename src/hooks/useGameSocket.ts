import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL;

export function useGameSocket(gameId: string, onGameUpdate: (gameData: any) => void) {
    useEffect(() => {
        // Connect to the socket server
        const socket: Socket = io(SOCKET_URL, {
            transports: ['websocket'],
            withCredentials: true,
        });

        // Join the game room
        socket.emit('joinGame', gameId);

        // Listen for game updates
        socket.on('gameUpdated', (gameData) => {
            onGameUpdate(gameData);
        });

        // Cleanup on unmount
        return () => {
            socket.emit('leaveGame', gameId);
            socket.disconnect();
        };
    }, [gameId, onGameUpdate]);
}