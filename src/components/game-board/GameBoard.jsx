import { useState, useEffect } from 'react';
import './GameBoard.css';
import Confetti from 'react-confetti';
import GridCell from '../grid/grid-cell/GridCell';
import Modal from '../modal/modal';
import Piece from '../piece/Piece';
import GridContainer from '../grid/grid-container/GridContainer';
import PlayerInfoBar from '../playerInfoBar/playerInfoBar';
import { didWin } from './helpers/didWin';
import { updateGame } from '../../services/gameService';
import { getKeyCoordinates, toCellKey } from '../../utils/gameUtilities';
import { getPieceMoves } from './helpers/getPieceMoves';
import { movePiece } from './helpers';
import { getValidPasses } from './helpers/getValidPasses';
import { passBall } from './helpers/passBall';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { fetchGame } from './helpers/fetchGame';
import { includesCoordinates } from './helpers/includesCoordinates';

const GameBoard = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState({
    gameId: gameId,
    gameData: null,
    isUserTurn: true,
    activePiece: null,
    possibleMoves: [],
    gameBoard: null,
    movedPiece: null,
    movedPieceOriginalPosition: null,
    possiblePasses: [],
    playerColor: localStorage.getItem('userColor'),
    winner: null
  });
  const [intervalId, setIntervalId] = useState(null);
  const isUserWhite = gameState.playerColor === 'white';
  const currentPlayerName = gameState.gameData ? (isUserWhite ? gameState.gameData.whitePlayerName : gameState.gameData.blackPlayerName) : 'Loading...';
  const opponentPlayerName = gameState.gameData ? (!isUserWhite ? gameState.gameData.whitePlayerName : gameState.gameData.blackPlayerName) : 'Loading...';
  useEffect(() => {
    fetchGame(gameId, setGameState, localStorage.getItem('userColor'));
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [gameId, gameState.playerColor, intervalId]);
  
  function handleClick(event) {
    debugger;
    event.stopPropagation();
    const cellKey = event.currentTarget.id;
    const element = gameState.gameBoard[cellKey];
    const isPiece = !!element;  // Simplify the check to boolean
    const hasBall = element?.hasBall === "true";
    const { row, col } = getKeyCoordinates(cellKey);
    const pieceColor = element?.color;

    setGameState(prevState => {
        const isFirstClickOnPiece = !prevState.movedPiece && !prevState.activePiece;
        const unselectingASelectedPiece = prevState.activePiece && element === prevState.activePiece;
        const selectingPieceThatIsNotActivePiece = prevState.activePiece && element !== prevState.activePiece;
        const activePieceHasBall = prevState.activePiece?.hasBall;
        const noPieceHasMovedAndMoveIsValid = !prevState.movedPiece && includesCoordinates(prevState.possibleMoves, {row,col})
        const aPieceHasMoved = !!prevState.movedPiece;
        const isReturningToOriginalSquare = cellKey === prevState.originalSquare && includesCoordinates(prevState.possibleMoves, {row,col})
        const noActivePiece = !prevState.activePiece

        let newState = { ...prevState };

        if (isPiece) {
            if (hasBall) {
                newState.activePiece = { ...element, position: cellKey };
                newState.possiblePasses = getValidPasses(row, col, pieceColor, prevState.gameBoard);
            } else if (isFirstClickOnPiece) {
              newState.activePiece = { ...element, position: cellKey };
                newState.possibleMoves = getPieceMoves(row, col, prevState.gameBoard);
            } else if (unselectingASelectedPiece) {
                newState.activePiece = null;
                newState.possibleMoves = [];
            } else if (selectingPieceThatIsNotActivePiece) {
                if (activePieceHasBall) {
                    newState.gameBoard = passBall();
                    didWin(gameState.gameBoard);
                    newState.possiblePasses = getValidPasses(row, col, pieceColor, prevState.gameBoard);
                }
                newState.activePiece = { ...element, position: cellKey };
                newState.possibleMoves = getPieceMoves(row, col, prevState.gameBoard);
            }
        } else {
            if (noActivePiece) {
                console.log("No piece selected, please select a piece.");
                newState.activePiece = null;
                newState.possibleMoves = [];
            } else if (prevState.activePiece) {
                if (activePieceHasBall) {
                    newState.activePiece = null;
                    newState.possibleMoves = [];
                } else if (noPieceHasMovedAndMoveIsValid) {
                    newState.gameBoard = movePiece(prevState.activePiece.position, cellKey, prevState.gameBoard);
                    newState.movedPiece = prevState.activePiece;
                    newState.originalSquare = prevState.activePiece.position;
                    newState.possibleMoves = [prevState.activePiece.position];
                } else if (aPieceHasMoved) {
                    if (isReturningToOriginalSquare) {
                        newState.gameBoard = movePiece(prevState.movedPiece.position, cellKey, prevState.gameBoard);
                        newState.movedPiece = null;
                        newState.originalSquare = null;
                        newState.possibleMoves = [];
                    } else {
                        console.log("Move not allowed, return piece to original position or pass the ball.");
                    }
                } else {
                    console.log("Invalid operation.");
                    newState.activePiece = null;
                    newState.possibleMoves = [];
                    newState.possiblePasses = [];
                }
            }
        }
        return newState;
    });
}

  const handlePassTurn = async () => {
    const currentPlayerColor = localStorage.getItem('userColor');
    const nextPlayerTurn = currentPlayerColor === 'white' ? 'black' : 'white';
  
    try {
      // Prepare updates for the backend
      const updates = {
        currentPlayerTurn: nextPlayerTurn,
        activePiece: null,
        hasMoved: false,
        originalSquare: null,
        possibleMoves: [],
        possiblePasses: []
      };
  
      // Call backend update
      const updatedGame = await updateGame(gameId, updates);
      setGameState(prevState => ({
        ...prevState,
        gameData: updatedGame,
        isUserTurn: updatedGame.currentPlayerTurn === currentPlayerColor,
        activePiece: null,
        hasMoved: false,
        originalSquare: null,
        possibleMoves: [],
        possiblePasses: []
      }));
  
      // Manage interval based on turn
      if (updatedGame.currentPlayerTurn === currentPlayerColor && intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      } else if (!intervalId) {
        setIntervalId(setInterval(fetchGame, 3000));
      }
    } catch (error) {
      console.error('Failed to update game:', error);
    }
  };  

  const renderBoard = () => {
    if (!gameState.gameData) {
      return <p>Loading game board...</p>;
    }
    return (
      <>
        {Object.entries(gameState.gameData.currentBoardStatus).map(([cellKey, cellData]) => {
          const { row, col } = getKeyCoordinates(cellKey);
          const isPossibleMove = gameState.possibleMoves.some(move => cellKey === toCellKey(move.row, move.col));
          const isPossiblePass = gameState.possiblePasses.some(pass => cellKey === pass);
          const isActivePiece = gameState.activePiece && gameState.activePiece.position === cellKey;
          return (
            <GridCell
            key={cellKey}
            row={row}
            col={col}
            redHighlight={isPossibleMove}
            yellowHighlight={isPossiblePass}
            blueHighlight={isActivePiece}
            data-type="cell"
            id={cellKey}
            onClick={handleClick}
        >
          {cellData && (
            <Piece
              color={cellData.color}
              hasBall={cellData.hasBall}
              position={cellKey}
              isPiece="true"
              onClick={(e) => { e.stopPropagation(); handleClick(e); }}
              />
            )}
            </GridCell>
          );
        })}
      </>
    );
  };

  if (!gameState.gameData) {
    return <div>Loading game data...</div>;
  }
  const rotationStyle = gameState.playerColor === 'black' ? '180deg' : '0deg';
  return (
    <div className="game-container">
      {console.log(gameState)}
      {gameState.gameData.status === 'completed' && <Confetti />}
      <PlayerInfoBar
        playerName={opponentPlayerName}
      />
      <div className="board-and-info">
        {console.log(rotationStyle)}
        <div className="board-container" style={{ transform: `rotate(${rotationStyle})` }}>
        <div className="board-container">
          <GridContainer>{renderBoard()}</GridContainer>
        </div>
        </div>
      
        {gameState.gameData.status === 'playing' && !gameState.isUserTurn && (
          <Modal>
            <p>It&apos;s not your turn. Please wait for the other player.</p>
          </Modal>
        )}
        {gameState.gameData.status === 'completed' && (
          <div className="game-over-controls">
            <h2>{gameState.winner} wins!</h2>
            <button onClick={() => navigate('/')}>Return to Lobby</button>
          </div>
        )}
      </div>
      <PlayerInfoBar
        playerName={currentPlayerName}
      />
      <button 
        onClick={handlePassTurn} 
        disabled={!gameState.isUserTurn} 
        style={{ alignSelf: 'flex-start', margin: '10px' }}
      >
        Pass Turn
      </button>
    </div>
    
  );
};

export default GameBoard;
