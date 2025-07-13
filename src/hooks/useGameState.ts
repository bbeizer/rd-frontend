import { useState, useEffect, useCallback } from 'react';
import { GameState } from '../types/GameState';
import { ServerGame } from '../types/ServerGame';
import { convertServerGameToGameState } from '../utils/convertServerGameToGameState';
import { updateGame } from '../services/gameService';
import { getAIMove } from '../services/aiService';

interface UseGameStateProps {
    gameId: string;
    userColor: string | null;
}

export const useGameState = ({ gameId, userColor }: UseGameStateProps) => {
    const [gameState, setGameState] = useState<GameState>(() => ({
        gameId,
        gameType: null,
        currentPlayerTurn: 'white',
        activePiece: null,
        possibleMoves: [],
        conversation: [],
        movedPiece: null,
        movedPieceOriginalPosition: null,
        possiblePasses: [],
        hasMoved: false,
        originalSquare: null,
        currentBoardStatus: {},
        playerColor: userColor,
        winner: null,
    }));

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const aiColor = userColor === 'white' ? 'black' : 'white';
    const isUserTurn = gameState.currentPlayerTurn === userColor;

    // Fetch game data from server
    const fetchGameData = useCallback(async () => {
        if (!gameId) return;

        try {
            setIsLoading(true);
            setError(null);

            // For now, use localhost for both development and testing
            const baseUrl =
                process.env.NODE_ENV === 'production'
                    ? import.meta.env.VITE_API_BASE_URL
                    : 'http://localhost:5050';

            const response = await fetch(`${baseUrl}/api/games/${gameId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch game: ${response.statusText}`);
            }

            const serverGame: ServerGame = await response.json();
            const convertedGame = convertServerGameToGameState(serverGame, userColor as 'white' | 'black');

            setGameState(prevState => {
                if (JSON.stringify(prevState) === JSON.stringify(convertedGame)) {
                    return prevState; // No change
                }
                return {
                    ...convertedGame,
                    conversation: convertedGame.conversation || [],
                };
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch game data');
        } finally {
            setIsLoading(false);
        }
    }, [gameId, userColor]);

    // Update game on server
    const updateGameOnServer = useCallback(async (updates: Partial<GameState>) => {
        if (!gameId) {
            throw new Error('Game ID is required');
        }

        try {
            const response = await updateGame(gameId, updates);
            if (!response.success) {
                throw new Error(response.error || 'Failed to update game');
            }
            return response.data;
        } catch (err) {
            throw err;
        }
    }, [gameId]);

    // Handle AI moves
    const handleAIMove = useCallback(async () => {
        if (gameState.gameType !== 'singleplayer' || gameState.currentPlayerTurn !== aiColor) {
            return;
        }

        try {
            const aiMoveResult = await getAIMove(gameState, aiColor);
            setGameState(prev => ({
                ...prev,
                ...aiMoveResult,
            }));

            // Update server with AI move
            await updateGameOnServer(aiMoveResult);
        } catch (err) {
            setError('AI move failed');
        }
    }, [gameState, aiColor, updateGameOnServer]);

    // Handle AI moves
    useEffect(() => {
        handleAIMove();
    }, [handleAIMove]);

    // Initial game fetch
    useEffect(() => {
        fetchGameData();
    }, [fetchGameData]);

    return {
        gameState,
        setGameState,
        isLoading,
        error,
        isUserTurn,
        fetchGameData,
        updateGameOnServer,
    };
}; 