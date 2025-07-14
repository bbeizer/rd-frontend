import { renderHook, waitFor, act } from '@testing-library/react';
import { useGameState } from '../useGameState';

// Mock the services
jest.mock('../../services/gameService', () => ({
    updateGame: jest.fn(),
}));

jest.mock('../../services/aiService', () => ({
    getAIMove: jest.fn(),
}));

jest.mock('../../services/apiClient', () => ({
    getApiBaseUrl: () => 'http://localhost:5050',
}));

// Import the mocked functions
import { updateGame } from '../../services/gameService';
import { getAIMove } from '../../services/aiService';

const mockUpdateGame = updateGame as jest.MockedFunction<typeof updateGame>;
const mockGetAIMove = getAIMove as jest.MockedFunction<typeof getAIMove>;

// Mock fetch
global.fetch = jest.fn();

describe('useGameState', () => {
    const mockGameId = 'test-game-id';
    const mockUserColor = 'white';

    const mockServerGame = {
        _id: mockGameId,
        status: 'playing',
        gameType: 'singleplayer',
        currentBoardStatus: {
            'e1': { color: 'white', hasBall: false, position: 'e1' },
            'd1': { color: 'white', hasBall: true, position: 'd1' },
        },
        possibleMoves: [],
        possiblePasses: [],
        winner: null,
        activePiece: null,
        movedPiece: null,
        hasMoved: false,
        originalSquare: null,
        whitePlayerName: 'TestWhite',
        blackPlayerName: 'TestBlack',
        aiColor: 'black',
        turnNumber: 1,
        currentPlayerTurn: 'white',
        moveHistory: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useGameState({
            gameId: mockGameId,
            userColor: mockUserColor
        }));

        expect(result.current.gameState.gameId).toBe(mockGameId);
        expect(result.current.gameState.currentPlayerTurn).toBe('white');
        expect(result.current.isLoading).toBe(true);
        expect(result.current.error).toBeNull();
    });

    it('should fetch game data successfully', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockServerGame,
        });

        const { result } = renderHook(() => useGameState({
            gameId: mockGameId,
            userColor: mockUserColor
        }));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.gameState.gameType).toBe('singleplayer');
        expect(result.current.gameState.whitePlayerName).toBe('TestWhite');
        expect(result.current.error).toBeNull();
    });

    it('should handle fetch errors', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        const { result } = renderHook(() => useGameState({
            gameId: mockGameId,
            userColor: mockUserColor
        }));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.error).toBe('Network error');
    });

    it('should update game on server successfully', async () => {
        // Set up the mock before rendering the hook
        mockUpdateGame.mockResolvedValueOnce({
            success: true,
            data: mockServerGame,
        });

        const { result } = renderHook(() => useGameState({
            gameId: mockGameId,
            userColor: mockUserColor
        }));

        const updates = { currentPlayerTurn: 'black' };

        await act(async () => {
            await result.current.updateGameOnServer(updates);
        });

        expect(mockUpdateGame).toHaveBeenCalledWith(mockGameId, updates);
    });

    it('should calculate isUserTurn correctly', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockServerGame,
        });

        const { result } = renderHook(() => useGameState({
            gameId: mockGameId,
            userColor: mockUserColor
        }));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isUserTurn).toBe(true);
    });

    it('should initialize singleplayer game as white correctly', async () => {
        const mockWhiteGame = {
            ...mockServerGame,
            whitePlayerName: 'PlayerWhite',
            blackPlayerName: 'AI',
            currentPlayerTurn: 'white',
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockWhiteGame,
        });

        const { result } = renderHook(() => useGameState({
            gameId: mockGameId,
            userColor: 'white'
        }));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.gameState.whitePlayerName).toBe('PlayerWhite');
        expect(result.current.gameState.blackPlayerName).toBe('AI');
        expect(result.current.gameState.currentPlayerTurn).toBe('white');
        expect(result.current.isUserTurn).toBe(true);
    });

    it('should initialize singleplayer game as black correctly', async () => {
        const mockBlackGame = {
            ...mockServerGame,
            whitePlayerName: 'AI',
            blackPlayerName: 'PlayerBlack',
            currentPlayerTurn: 'white', // AI starts
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockBlackGame,
        });

        const { result } = renderHook(() => useGameState({
            gameId: mockGameId,
            userColor: 'black'
        }));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.gameState.whitePlayerName).toBe('AI');
        expect(result.current.gameState.blackPlayerName).toBe('PlayerBlack');
        expect(result.current.gameState.currentPlayerTurn).toBe('white');
        expect(result.current.isUserTurn).toBe(false); // AI's turn first
    });
}); 