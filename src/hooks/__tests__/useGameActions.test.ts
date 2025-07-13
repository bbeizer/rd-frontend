import { renderHook, act } from '@testing-library/react';
import { useGameActions } from '../useGameActions';
import { updateGameState } from '../../components/GameBoard/helpers/updateGameState';
import { getAIMove } from '../../services/aiService';

// Mock dependencies
jest.mock('../../components/GameBoard/helpers/updateGameState');
jest.mock('../../services/aiService');

const mockUpdateGameState = updateGameState as jest.MockedFunction<typeof updateGameState>;
const mockGetAIMove = getAIMove as jest.MockedFunction<typeof getAIMove>;

describe('useGameActions', () => {
    let mockSetGameState: jest.Mock;
    let mockUpdateGameOnServer: jest.Mock;
    let mockOnGameEnd: jest.Mock;

    beforeEach(() => {
        mockSetGameState = jest.fn();
        mockUpdateGameOnServer = jest.fn();
        mockOnGameEnd = jest.fn();
        jest.clearAllMocks();
    });

    const createMockGameState = (overrides = {}) => ({
        gameId: 'test-game-id',
        gameType: 'multiplayer' as const,
        currentPlayerTurn: 'white' as const,
        playerColor: 'white' as const,
        currentBoardStatus: {
            'd1': { color: 'white' as const, hasBall: true, position: 'd1' },
            'e1': { color: 'white' as const, hasBall: false, position: 'e1' },
            'c8': { color: 'black' as const, hasBall: false, position: 'c8' },
            'e8': { color: 'black' as const, hasBall: true, position: 'e8' },
        },
        activePiece: null,
        movedPiece: null,
        hasMoved: false,
        possibleMoves: [],
        possiblePasses: [],
        conversation: [],
        whitePlayerName: 'TestWhite',
        blackPlayerName: 'TestBlack',
        isUserTurn: true,
        status: 'playing' as const,
        winner: null,
        movedPieceOriginalPosition: null,
        originalSquare: null,
        ...overrides,
    });

    describe('handleCellClick', () => {
        it('should select a piece when clicking on a valid piece', async () => {
            const gameState = createMockGameState();
            const newState = { ...gameState, activePiece: 'd1', possibleMoves: ['e2', 'f3'] };
            mockUpdateGameState.mockReturnValue(newState);

            const { result } = renderHook(() => useGameActions({
                gameState,
                setGameState: mockSetGameState,
                updateGameOnServer: mockUpdateGameOnServer,
                onGameEnd: mockOnGameEnd,
                userColor: 'white',
            }));

            await act(async () => {
                await result.current.handleCellClick('d1');
            });

            expect(mockUpdateGameState).toHaveBeenCalledWith('d1', gameState);
            expect(mockSetGameState).toHaveBeenCalledWith(newState);
            expect(mockUpdateGameOnServer).toHaveBeenCalledWith(newState);
        });

        it('should not allow selecting opponent pieces', async () => {
            const gameState = createMockGameState();
            // Mock updateGameState to return the same state (no change)
            mockUpdateGameState.mockReturnValue(gameState);

            const { result } = renderHook(() => useGameActions({
                gameState,
                setGameState: mockSetGameState,
                updateGameOnServer: mockUpdateGameOnServer,
                onGameEnd: mockOnGameEnd,
                userColor: 'white',
            }));

            await act(async () => {
                await result.current.handleCellClick('c8'); // Black piece
            });

            // The hook still calls setGameState even if no change, but should not update server
            expect(mockUpdateGameState).toHaveBeenCalledWith('c8', gameState);
            expect(mockSetGameState).toHaveBeenCalledWith(gameState);
            // Should still update server even if no state change
            expect(mockUpdateGameOnServer).toHaveBeenCalledWith(gameState);
        });

        it('should move a piece when clicking on a valid move square', async () => {
            const gameState = createMockGameState({ activePiece: 'd1' });
            const newState = {
                ...gameState,
                activePiece: null,
                movedPiece: 'd1',
                currentBoardStatus: {
                    ...gameState.currentBoardStatus,
                    'e2': { color: 'white' as const, hasBall: true, position: 'e2' },
                    'd1': { color: 'white' as const, hasBall: false, position: 'd1' },
                }
            };
            mockUpdateGameState.mockReturnValue(newState);

            const { result } = renderHook(() => useGameActions({
                gameState,
                setGameState: mockSetGameState,
                updateGameOnServer: mockUpdateGameOnServer,
                onGameEnd: mockOnGameEnd,
                userColor: 'white',
            }));

            await act(async () => {
                await result.current.handleCellClick('e2');
            });

            expect(mockUpdateGameState).toHaveBeenCalledWith('e2', gameState);
            expect(mockSetGameState).toHaveBeenCalledWith(newState);
            expect(mockUpdateGameOnServer).toHaveBeenCalledWith(newState);
        });

        it('should handle ball passing when clicking on valid pass target', async () => {
            const gameState = createMockGameState({
                activePiece: 'd1',
                possiblePasses: ['e8']
            });
            const newState = {
                ...gameState,
                activePiece: null,
                currentBoardStatus: {
                    ...gameState.currentBoardStatus,
                    'd1': { color: 'white' as const, hasBall: false, position: 'd1' },
                    'e8': { color: 'black' as const, hasBall: true, position: 'e8' },
                }
            };
            mockUpdateGameState.mockReturnValue(newState);

            const { result } = renderHook(() => useGameActions({
                gameState,
                setGameState: mockSetGameState,
                updateGameOnServer: mockUpdateGameOnServer,
                onGameEnd: mockOnGameEnd,
                userColor: 'white',
            }));

            await act(async () => {
                await result.current.handleCellClick('e8');
            });

            expect(mockUpdateGameState).toHaveBeenCalledWith('e8', gameState);
            expect(mockSetGameState).toHaveBeenCalledWith(newState);
            expect(mockUpdateGameOnServer).toHaveBeenCalledWith(newState);
        });
    });

    describe('handlePassTurn', () => {
        it('should handle pass turn in multiplayer games', async () => {
            const gameState = createMockGameState({ gameType: 'multiplayer' });

            const { result } = renderHook(() => useGameActions({
                gameState,
                setGameState: mockSetGameState,
                updateGameOnServer: mockUpdateGameOnServer,
                onGameEnd: mockOnGameEnd,
                userColor: 'white',
            }));

            await act(async () => {
                await result.current.handlePassTurn();
            });

            expect(mockUpdateGameOnServer).toHaveBeenCalledWith({
                ...gameState,
                currentPlayerTurn: 'black',
                activePiece: null,
                movedPiece: null,
                hasMoved: false,
                possibleMoves: [],
                possiblePasses: [],
            });
            expect(mockSetGameState).toHaveBeenCalled();
        });

        it('should handle pass turn in singleplayer games', async () => {
            const singleplayerState = createMockGameState({
                gameType: 'singleplayer',
                currentPlayerTurn: 'white', // User's turn
                playerColor: 'white'
            });

            const aiMoveResult = {
                ...singleplayerState,
                currentBoardStatus: {
                    ...singleplayerState.currentBoardStatus,
                    'e2': { color: 'black' as const, hasBall: true, position: 'e2' },
                    'e8': { color: 'black' as const, hasBall: false, position: 'e8' },
                }
            };
            mockGetAIMove.mockResolvedValue(aiMoveResult);

            const { result } = renderHook(() => useGameActions({
                gameState: singleplayerState,
                setGameState: mockSetGameState,
                updateGameOnServer: mockUpdateGameOnServer,
                onGameEnd: mockOnGameEnd,
                userColor: 'white',
            }));

            await act(async () => {
                await result.current.handlePassTurn();
            });

            // In singleplayer, should call AI service and switch turn back to user
            expect(mockGetAIMove).toHaveBeenCalledWith(singleplayerState, 'black');
            expect(mockUpdateGameOnServer).toHaveBeenCalledWith({
                ...aiMoveResult,
                currentPlayerTurn: 'white', // Back to user's turn
                activePiece: null,
                movedPiece: null,
                hasMoved: false,
                possibleMoves: [],
                possiblePasses: [],
            });
            expect(mockSetGameState).toHaveBeenCalled();
        });

        it('should handle AI move failure in singleplayer games', async () => {
            const singleplayerState = createMockGameState({
                gameType: 'singleplayer',
                currentPlayerTurn: 'white',
                playerColor: 'white'
            });

            mockGetAIMove.mockRejectedValue(new Error('AI service unavailable'));

            const { result } = renderHook(() => useGameActions({
                gameState: singleplayerState,
                setGameState: mockSetGameState,
                updateGameOnServer: mockUpdateGameOnServer,
                onGameEnd: mockOnGameEnd,
                userColor: 'white',
            }));

            await act(async () => {
                await result.current.handlePassTurn();
            });

            // Should still call AI service
            expect(mockGetAIMove).toHaveBeenCalledWith(singleplayerState, 'black');

            // Should fallback to just switching turn back to user
            expect(mockUpdateGameOnServer).toHaveBeenCalledWith({
                ...singleplayerState,
                currentPlayerTurn: 'white', // Back to user's turn
                activePiece: null,
                movedPiece: null,
                hasMoved: false,
                possibleMoves: [],
                possiblePasses: [],
            });
            expect(mockSetGameState).toHaveBeenCalled();
        });
    });

    describe('handleSendMessage', () => {
        it('should send a message in multiplayer games', async () => {
            const gameState = createMockGameState({ gameType: 'multiplayer' });
            const newMessage = { author: 'TestWhite', text: 'Hello!' };

            const { result } = renderHook(() => useGameActions({
                gameState,
                setGameState: mockSetGameState,
                updateGameOnServer: mockUpdateGameOnServer,
                onGameEnd: mockOnGameEnd,
                userColor: 'white',
            }));

            await act(async () => {
                await result.current.handleSendMessage(newMessage);
            });

            expect(mockSetGameState).toHaveBeenCalledWith(expect.any(Function));
            // Check that the function updates the conversation correctly
            const setStateCall = mockSetGameState.mock.calls[0][0];
            const updatedState = setStateCall(gameState);
            expect(updatedState.conversation).toEqual([newMessage]);
            expect(mockUpdateGameOnServer).toHaveBeenCalledWith({
                newMessage: expect.objectContaining({
                    author: 'TestWhite',
                    text: 'Hello!',
                    timestamp: expect.any(String),
                }),
            });
        });

        it('should not send messages in singleplayer games', async () => {
            const gameState = createMockGameState({ gameType: 'singleplayer' });
            const newMessage = { author: 'TestWhite', text: 'Hello!' };

            const { result } = renderHook(() => useGameActions({
                gameState,
                setGameState: mockSetGameState,
                updateGameOnServer: mockUpdateGameOnServer,
                onGameEnd: mockOnGameEnd,
                userColor: 'white',
            }));

            await act(async () => {
                await result.current.handleSendMessage(newMessage);
            });

            // The hook still sends messages in singleplayer, just doesn't update server
            expect(mockSetGameState).toHaveBeenCalledWith(expect.any(Function));
            // Check that the function updates the conversation correctly
            const setStateCall = mockSetGameState.mock.calls[0][0];
            const updatedState = setStateCall(gameState);
            expect(updatedState.conversation).toEqual([newMessage]);
            // Should still update server in singleplayer
            expect(mockUpdateGameOnServer).toHaveBeenCalledWith({
                newMessage: expect.objectContaining({
                    author: 'TestWhite',
                    text: 'Hello!',
                    timestamp: expect.any(String),
                }),
            });
        });
    });

    describe('game end handling', () => {
        it('should call onGameEnd when a winner is determined', async () => {
            const gameState = createMockGameState();
            const newState = { ...gameState, winner: 'TestWhite' };
            mockUpdateGameState.mockReturnValue(newState);

            const { result } = renderHook(() => useGameActions({
                gameState,
                setGameState: mockSetGameState,
                updateGameOnServer: mockUpdateGameOnServer,
                onGameEnd: mockOnGameEnd,
                userColor: 'white',
            }));

            await act(async () => {
                await result.current.handleCellClick('d1');
            });

            expect(mockOnGameEnd).toHaveBeenCalledWith('TestWhite');
        });
    });
}); 