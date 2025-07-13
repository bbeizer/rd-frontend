import { useCallback } from 'react';
import { GameState } from '../types/GameState';
import { updateGameState } from '../components/GameBoard/helpers/updateGameState';
import { MessageProps } from '../components/Message/Message';
import { getAIMove } from '../services/aiService';

interface UseGameActionsProps {
    gameState: GameState;
    setGameState: (state: GameState | ((prev: GameState) => GameState)) => void;
    updateGameOnServer: (updates: any) => Promise<any>;
    onGameEnd?: (winner: string) => void;
    userColor: string | null;
}

export const useGameActions = ({
    gameState,
    setGameState,
    updateGameOnServer,
    onGameEnd,
    userColor,
}: UseGameActionsProps) => {

    // Handle cell click
    const handleCellClick = useCallback(async (cellKey: string) => {
        try {
            // Check if it's the user's turn
            if (gameState.currentPlayerTurn !== userColor) {
                return;
            }

            const newState = updateGameState(cellKey, gameState);

            // Update local state immediately for responsive UI
            setGameState(newState);

            // Check for game end
            if (newState.winner) {
                onGameEnd?.(newState.winner);
                return;
            }

            // Update server
            await updateGameOnServer(newState);
        } catch (error) {
            // Could add toast notification here
        }
    }, [gameState, setGameState, updateGameOnServer, onGameEnd, userColor]);

    // Handle pass turn
    const handlePassTurn = useCallback(async () => {
        try {
            // Check if it's the user's turn
            if (gameState.currentPlayerTurn !== userColor) {
                return;
            }

            const aiColor = userColor === 'white' ? 'black' : 'white';

            if (gameState.gameType === 'singleplayer') {
                // In singleplayer, get AI move and switch back to user's turn

                try {
                    const aiMoveResult = await getAIMove(gameState, aiColor);

                    // Update local state with AI move
                    setGameState(prev => ({
                        ...prev,
                        ...aiMoveResult,
                        currentPlayerTurn: userColor, // Switch back to user's turn
                        activePiece: null,
                        movedPiece: null,
                        hasMoved: false,
                        possibleMoves: [],
                        possiblePasses: [],
                    }));

                    // Update server with AI move and turn back to user
                    await updateGameOnServer({
                        ...aiMoveResult,
                        currentPlayerTurn: userColor,
                        activePiece: null,
                        movedPiece: null,
                        hasMoved: false,
                        possibleMoves: [],
                        possiblePasses: [],
                    });

                } catch (aiError) {
                    // Fallback: just switch turn without AI move
                    const updates = {
                        ...gameState,
                        currentPlayerTurn: userColor,
                        activePiece: null,
                        movedPiece: null,
                        hasMoved: false,
                        possibleMoves: [],
                        possiblePasses: [],
                    };

                    await updateGameOnServer(updates);
                    setGameState(prev => ({ ...prev, ...updates }));
                }
            } else {
                // In multiplayer, just switch to next player's turn
                const nextPlayerTurn = userColor === 'white' ? 'black' : 'white';

                const updates = {
                    ...gameState,
                    currentPlayerTurn: nextPlayerTurn,
                    activePiece: null,
                    movedPiece: null,
                    hasMoved: false,
                    possibleMoves: [],
                    possiblePasses: [],
                };

                await updateGameOnServer(updates);

                setGameState(prev => ({
                    ...prev,
                    ...updates,
                }));
            }
        } catch (error) {
        }
    }, [gameState, setGameState, updateGameOnServer, userColor]);

    // Handle sending message
    const handleSendMessage = useCallback(async (newMessage: MessageProps) => {
        try {
            // Optimistically update local state
            setGameState(prev => ({
                ...prev,
                conversation: [...(prev.conversation || []), newMessage],
            }));

            // Update server
            await updateGameOnServer({
                newMessage: {
                    author: newMessage.author,
                    text: newMessage.text,
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (error) {
            // Could rollback optimistic update here
        }
    }, [setGameState, updateGameOnServer]);

    // Handle game end
    const handleGameEnd = useCallback(async (winner: string) => {
        try {
            const updates = {
                winner,
                status: 'completed',
                activePiece: null,
                movedPiece: null,
                originalSquare: null,
                possibleMoves: [],
                possiblePasses: [],
            };

            await updateGameOnServer(updates);

            setGameState(prev => ({
                ...prev,
                ...updates,
            }));

            onGameEnd?.(winner);
        } catch (error) {
        }
    }, [setGameState, updateGameOnServer, onGameEnd]);

    return {
        handleCellClick,
        handlePassTurn,
        handleSendMessage,
        handleGameEnd,
    };
}; 