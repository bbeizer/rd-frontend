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

            // Check for win condition after the move
            if (newState.currentBoardStatus) {
                const { didWin } = await import('../components/GameBoard/helpers/didWin');
                const hasWon = didWin(newState.currentBoardStatus);

                if (hasWon) {
                    // Determine winner based on whose turn it was
                    const winner = gameState.currentPlayerTurn === 'white'
                        ? (gameState.whitePlayerName || 'White')
                        : (gameState.blackPlayerName || 'Black');

                    newState.winner = winner;
                    newState.status = 'completed';
                }
            }

            // Update local state immediately for responsive UI
            setGameState(newState);

            // Update server (even if there's a winner, so other players get notified)
            await updateGameOnServer(newState);

            // Check for game end after server update
            if (newState.winner) {
                onGameEnd?.(newState.winner);
            }
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

            const aiColor = gameState.aiColor;

            if (gameState.gameType === 'singleplayer') {
                // In singleplayer, get AI move and switch back to user's turn

                try {
                    const aiMoveResult = await getAIMove(gameState, aiColor || 'black');

                    // Handle case where AI service doesn't return expected format
                    if (!aiMoveResult) {
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
                        return;
                    }

                    // Preserve player names and important state
                    const updatedState = {
                        ...gameState,
                        ...aiMoveResult,
                        // Preserve player names to prevent the "Nic" bug
                        whitePlayerName: gameState.whitePlayerName,
                        blackPlayerName: gameState.blackPlayerName,
                        // Preserve game metadata
                        gameId: gameState.gameId,
                        gameType: gameState.gameType,
                        aiColor: gameState.aiColor,
                        currentPlayerTurn: userColor, // Switch back to user's turn
                        activePiece: null,
                        movedPiece: null,
                        hasMoved: false,
                        possibleMoves: [],
                        possiblePasses: [],
                    };

                    // Check for win condition after AI move
                    if (aiMoveResult.currentBoardStatus) {
                        const { didWin } = await import('../components/GameBoard/helpers/didWin');
                        const hasWon = didWin(aiMoveResult.currentBoardStatus);

                        if (hasWon) {
                            updatedState.status = 'completed';
                        }
                    }

                    // Update local state with AI move
                    setGameState(updatedState);

                    // Update server with AI move and turn back to user
                    await updateGameOnServer(updatedState);

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