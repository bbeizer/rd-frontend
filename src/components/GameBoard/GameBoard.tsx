import { useParams, useNavigate } from 'react-router-dom';
import { useGameState } from '../../hooks/useGameState';
import { useGameActions } from '../../hooks/useGameActions';
import Confetti from 'react-confetti';
import GridCell from '../grid/GridCell/GridCell';
import GridContainer from '../grid/GridContainer/GridContainer';
import Piece from '../piece/Piece';
import PlayerInfoBar from '../playerInfoBar/playerInfoBar';
import Modal from '../modal/modal';
import { getKeyCoordinates } from '../../utils/gameUtilities';
import ChatBox from '../ChatBox/ChatBox';
import { MessageProps } from '../Message/Message';
import './GameBoard.css';
import { useGameSocket } from '@/hooks/useGameSocket';
import { useEffect } from 'react';

const GameBoard = () => {
    const { gameId } = useParams<{ gameId: string }>();
    const navigate = useNavigate();
    const userColor = localStorage.getItem('userColor');

    if (!userColor || !gameId) {
        return <div>Invalid game configuration</div>;
    }

    const {
        gameState,
        setGameState,
        isLoading,
        error,
        isUserTurn,
        updateGameOnServer,
    } = useGameState({ gameId, userColor });

    // Detect when game ends and trigger confetti/modal
    useEffect(() => {
        if (gameState.status === 'completed' && gameState.winner) {
            // Game has ended - confetti and modal will be handled by existing logic
            console.log(`Game completed! Winner: ${gameState.winner}`);
        }
    }, [gameState.status, gameState.winner]);

    useGameSocket(gameId, (gameData) => {
        setGameState(gameData);
    });

    const {
        handleCellClick,
        handlePassTurn,
        handleSendMessage,
    } = useGameActions({
        gameState,
        setGameState,
        updateGameOnServer,
        userColor,
    });

    // Loading state
    if (isLoading) {
        return <div className="loading">Loading game...</div>;
    }

    // Error state
    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    // Game not found
    if (!gameState) {
        return <div>Game not found</div>;
    }

    const isUserWhite = userColor === 'white';
    const currentPlayerName = isUserWhite
        ? gameState.whitePlayerName
        : gameState.blackPlayerName;
    const opponentPlayerName = !isUserWhite
        ? gameState.whitePlayerName
        : gameState.blackPlayerName;
    const rotationStyle = userColor === 'black' ? '180deg' : '0deg';

    const renderBoard = () => {
        if (!gameState.currentBoardStatus) {
            return <p>Loading game board...</p>;
        }

        return Object.entries(gameState.currentBoardStatus)
            .sort(([keyA], [keyB]) => {
                const rowA = parseInt(keyA[1], 10);
                const rowB = parseInt(keyB[1], 10);
                const colA = keyA.charCodeAt(0);
                const colB = keyB.charCodeAt(0);
                return rowB - rowA || colA - colB;
            })
            .map(([cellKey, cellData]) => {
                const coords = getKeyCoordinates(cellKey);
                const isPossibleMove = gameState.possibleMoves.includes(cellKey);
                const isPossiblePass = gameState.possiblePasses.includes(cellKey);
                const isActivePiece = gameState.activePiece?.position === cellKey;

                return (
                    <GridCell
                        key={cellKey}
                        id={cellKey}
                        data-testid={cellKey}
                        row={parseInt(cellKey[1], 10) - 1}
                        col={cellKey.charCodeAt(0) - 'a'.charCodeAt(0)}
                        highlight={
                            isPossibleMove ? 'red' :
                                isPossiblePass ? 'yellow' :
                                    isActivePiece ? 'blue' : null
                        }
                        onClick={() => handleCellClick(cellKey)}
                    >
                        {cellData && (
                            <Piece
                                color={cellData.color}
                                hasBall={cellData.hasBall}
                                position={cellKey}
                                onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                                    e.stopPropagation();
                                    handleCellClick(cellKey);
                                }}
                            />
                        )}
                    </GridCell>
                );
            });
    };

    return (
        <div className="game-container">
            {gameState.status === 'completed' && <Confetti />}

            <div className="board-wrapper">
                <div className="board-column">
                    <div className="player-info top-player">
                        <PlayerInfoBar playerName={opponentPlayerName ?? 'Opponent'} />
                    </div>

                    <div className="board-container" data-testid="board-container" style={{ transform: `rotate(${rotationStyle})` }}>
                        <GridContainer>{renderBoard()}</GridContainer>

                        {/* Modals */}
                        {gameState.status === 'playing' && !isUserTurn && (
                            <Modal>
                                <div style={{ transform: `rotate(${rotationStyle})` }}>
                                    <p>It&apos;s not your turn. Please wait for the other player.</p>
                                </div>
                            </Modal>
                        )}

                        {gameState.status === 'completed' && (
                            <Modal>
                                <div style={{ transform: `rotate(${rotationStyle})` }}>
                                    <h2>{gameState.winner} wins!</h2>
                                    <button onClick={() => navigate('/')}>Return to Lobby</button>
                                </div>
                            </Modal>
                        )}
                    </div>

                    <div className="player-info bottom-player">
                        <PlayerInfoBar playerName={currentPlayerName ?? 'You'} />
                    </div>

                    <button
                        onClick={handlePassTurn}
                        disabled={!isUserTurn}
                        className="pass-turn-btn"
                    >
                        Pass Turn
                    </button>
                </div>

                {/* Only show chat in multiplayer */}
                {gameState.gameType === 'multiplayer' && (
                    <ChatBox
                        messages={gameState.conversation || []}
                        onSendMessage={handleSendMessage}
                        currentUserName={currentPlayerName ?? 'You'}
                    />
                )}
            </div>
        </div>
    );
};

export default GameBoard; 