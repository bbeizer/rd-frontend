import { useState, useCallback } from 'react';
import { GameState } from '../types/GameState';
import { MessageProps } from '../components/Message/Message';
import { sendGameAction } from '../services/actionService';
import { convertServerGameToGameState } from '../utils/convertServerGameToGameState';

interface UseGameActionsV2Props {
  gameState: GameState;
  setGameState: (state: GameState | ((prev: GameState) => GameState)) => void;
  onGameEnd?: (winner: string) => void;
  userColor: string | null;
  playerId: string;
}

/**
 * Action-based game actions hook.
 * Sends minimal actions to server, waits for server response as source of truth.
 */
export const useGameActionsV2 = ({
  gameState,
  setGameState,
  onGameEnd,
  userColor,
  playerId,
}: UseGameActionsV2Props) => {
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setActionError(null);
  }, []);

  // Handle cell click - send action to server
  const handleCellClick = useCallback(
    async (cellKey: string) => {
      // Quick client-side check - don't send if not user's turn
      if (gameState.currentPlayerTurn !== userColor) {
        return;
      }

      // Don't allow concurrent actions
      if (isProcessingAction) {
        return;
      }

      if (!gameState.gameId) {
        setActionError('Game ID is missing');
        return;
      }

      setIsProcessingAction(true);
      setActionError(null);

      try {
        const response = await sendGameAction(gameState.gameId, playerId, {
          type: 'CELL_CLICK',
          payload: { cellKey },
        });

        if (response.success && response.gameState) {
          const newState = convertServerGameToGameState(
            response.gameState,
            userColor as 'white' | 'black'
          );
          setGameState(newState);

          // Check for game end
          if (newState.winner) {
            onGameEnd?.(newState.winner);
          }
        } else {
          setActionError(response.error?.message || 'Action failed');
        }
      } catch (error) {
        setActionError(error instanceof Error ? error.message : 'Failed to connect to server');
      } finally {
        setIsProcessingAction(false);
      }
    },
    [gameState, userColor, playerId, isProcessingAction, setGameState, onGameEnd]
  );

  // Handle pass turn - send action to server
  // For singleplayer, server handles AI move internally and returns state after AI has moved
  const handlePassTurn = useCallback(async () => {
    // Quick client-side check
    if (gameState.currentPlayerTurn !== userColor) {
      return;
    }

    if (isProcessingAction) {
      return;
    }

    if (!gameState.gameId) {
      setActionError('Game ID is missing');
      return;
    }

    setIsProcessingAction(true);
    setActionError(null);

    try {
      const response = await sendGameAction(gameState.gameId, playerId, {
        type: 'PASS_TURN',
      });

      if (response.success && response.gameState) {
        const newState = convertServerGameToGameState(
          response.gameState,
          userColor as 'white' | 'black'
        );
        setGameState(newState);

        // Check for game end (AI might have won)
        if (newState.winner) {
          onGameEnd?.(newState.winner);
        }
      } else {
        setActionError(response.error?.message || 'Failed to pass turn');
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to connect to server');
    } finally {
      setIsProcessingAction(false);
    }
  }, [gameState, userColor, playerId, isProcessingAction, setGameState, onGameEnd]);

  // Handle sending message
  const handleSendMessage = useCallback(
    async (newMessage: MessageProps) => {
      if (!gameState.gameId) {
        setActionError('Game ID is missing');
        return;
      }

      // Optimistically update local state for messages (low risk)
      setGameState((prev) => ({
        ...prev,
        conversation: [...(prev.conversation || []), newMessage],
      }));

      try {
        const response = await sendGameAction(gameState.gameId, playerId, {
          type: 'SEND_MESSAGE',
          payload: {
            author: newMessage.author,
            text: newMessage.text,
          },
        });

        if (!response.success) {
          // Could rollback optimistic update here
          setActionError(response.error?.message || 'Failed to send message');
        }
        // Don't update state from response for messages - optimistic is fine
      } catch (error) {
        setActionError(error instanceof Error ? error.message : 'Failed to send message');
      }
    },
    [gameState.gameId, playerId, setGameState]
  );

  // Handle game end - used when game ends from other triggers
  const handleGameEnd = useCallback(
    async (winner: string) => {
      // For action-based API, the server determines game end
      // This is just for local notification
      onGameEnd?.(winner);
    },
    [onGameEnd]
  );

  return {
    handleCellClick,
    handlePassTurn,
    handleSendMessage,
    handleGameEnd,
    // New properties for loading/error UI
    isProcessingAction,
    actionError,
    clearError,
  };
};
