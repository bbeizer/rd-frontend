import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock ChatBox as a stub to avoid hook errors
jest.mock('../../ChatBox/ChatBox', () => () => <div data-testid="chatbox-mock" />);

// Default mocks for hooks
jest.mock('../../../hooks/useGameState', () => ({
    useGameState: () => ({
        gameState: {
            gameId: 'test-game-id',
            gameType: 'singleplayer',
            currentPlayerTurn: 'white',
            activePiece: null,
            possibleMoves: [],
            hasMoved: false,
            movedPiece: null,
            movedPieceOriginalPosition: null,
            possiblePasses: [],
            playerColor: 'white',
            originalSquare: null,
            winner: null,
            whitePlayerName: 'TestWhite',
            blackPlayerName: 'TestBlack',
            isUserTurn: true,
            currentBoardStatus: {
                'e1': { color: 'white', hasBall: false, position: 'e1' },
                'd1': { color: 'white', hasBall: true, position: 'd1' },
                'c8': { color: 'black', hasBall: false, position: 'c8' },
                'e8': { color: 'black', hasBall: true, position: 'e8' },
            },
            status: 'playing',
            conversation: [],
        },
        setGameState: jest.fn(),
        isLoading: false,
        error: null,
        isUserTurn: true,
        updateGameOnServer: jest.fn(),
    }),
}));

jest.mock('../../../hooks/useGameActions', () => ({
    useGameActions: () => ({
        handleCellClick: jest.fn(),
        handlePassTurn: jest.fn(),
        handleSendMessage: jest.fn(),
    }),
}));

jest.mock('react-router-dom', () => ({
    useParams: () => ({ gameId: 'test-game-id' }),
    useNavigate: () => jest.fn(),
}));

jest.mock('@/hooks/useGameSocket', () => ({
    useGameSocket: () => { }
}));

import GameBoard from '../GameBoard';

describe('GameBoard', () => {
    beforeEach(() => {
        // Set up localStorage for tests
        localStorage.setItem('userColor', 'white');
    });

    afterEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
    });

    it('renders the board and player info', () => {
        render(<GameBoard />);
        expect(screen.getByText('TestWhite')).toBeInTheDocument();
        expect(screen.getByText('TestBlack')).toBeInTheDocument();
    });

    it('renders the board container', () => {
        render(<GameBoard />);
        expect(screen.getByTestId('board-container')).toBeInTheDocument();
    });

    it('renders the pass turn button', () => {
        render(<GameBoard />);
        expect(screen.getByText('Pass Turn')).toBeInTheDocument();
    });

    it('renders game pieces on the board', () => {
        render(<GameBoard />);
        // Check that grid cells are rendered (they have id attributes)
        expect(screen.getByTestId('e1')).toBeInTheDocument();
        expect(screen.getByTestId('d1')).toBeInTheDocument();
        expect(screen.getByTestId('c8')).toBeInTheDocument();
        expect(screen.getByTestId('e8')).toBeInTheDocument();
    });

    it('rotates the board for black user in multiplayer', () => {
        // Mock multiplayer state and black user
        jest.resetModules();
        localStorage.setItem('userColor', 'black');
        jest.doMock('../../../hooks/useGameState', () => ({
            useGameState: () => ({
                gameState: {
                    gameId: 'test-game-id',
                    gameType: 'multiplayer',
                    currentPlayerTurn: 'white',
                    activePiece: null,
                    possibleMoves: [],
                    hasMoved: false,
                    movedPiece: null,
                    movedPieceOriginalPosition: null,
                    possiblePasses: [],
                    playerColor: 'black',
                    originalSquare: null,
                    winner: null,
                    whitePlayerName: 'TestWhite',
                    blackPlayerName: 'TestBlack',
                    isUserTurn: false,
                    currentBoardStatus: {
                        'e1': { color: 'white', hasBall: false, position: 'e1' },
                        'd1': { color: 'white', hasBall: true, position: 'd1' },
                        'c8': { color: 'black', hasBall: false, position: 'c8' },
                        'e8': { color: 'black', hasBall: true, position: 'e8' },
                    },
                    status: 'playing',
                    conversation: [],
                },
                setGameState: jest.fn(),
                isLoading: false,
                error: null,
                isUserTurn: false,
                updateGameOnServer: jest.fn(),
            }),
        }));
        // Re-import after mocking
        const GameBoardBlack = require('../GameBoard').default;
        render(<GameBoardBlack />);
        const board = screen.getByTestId('board-container');
        expect(board).toHaveStyle('transform: rotate(180deg)');
    });

    it('shows the not your turn modal for waiting player in multiplayer', () => {
        // Mock multiplayer state and black user
        jest.resetModules();
        localStorage.setItem('userColor', 'black');
        jest.doMock('../../../hooks/useGameState', () => ({
            useGameState: () => ({
                gameState: {
                    gameId: 'test-game-id',
                    gameType: 'multiplayer',
                    currentPlayerTurn: 'white',
                    activePiece: null,
                    possibleMoves: [],
                    hasMoved: false,
                    movedPiece: null,
                    movedPieceOriginalPosition: null,
                    possiblePasses: [],
                    playerColor: 'black',
                    originalSquare: null,
                    winner: null,
                    whitePlayerName: 'TestWhite',
                    blackPlayerName: 'TestBlack',
                    isUserTurn: false,
                    currentBoardStatus: {
                        'e1': { color: 'white', hasBall: false, position: 'e1' },
                        'd1': { color: 'white', hasBall: true, position: 'd1' },
                        'c8': { color: 'black', hasBall: false, position: 'c8' },
                        'e8': { color: 'black', hasBall: true, position: 'e8' },
                    },
                    status: 'playing',
                    conversation: [],
                },
                setGameState: jest.fn(),
                isLoading: false,
                error: null,
                isUserTurn: false,
                updateGameOnServer: jest.fn(),
            }),
        }));
        // Re-import after mocking
        const GameBoardBlack = require('../GameBoard').default;
        render(<GameBoardBlack />);
        expect(screen.getByText(/not your turn/i)).toBeInTheDocument();
    });
}); 