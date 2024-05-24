import React, { useState, useEffect } from 'react';
import GridCell from '../grid/grid-cell/GridCell';
import Piece from '../piece/Piece';
import GridContainer from '../grid/grid-container/GridContainer';
import { getGameById, updateGame } from '../../services/gameService';
import { getKeyCoordinates, toCellKey } from '../../utils/gameUtilities';
import { getPieceMoves } from '../../gameLogic/playerMovesRuleEngine';
import { movePiece } from './helpers';
import { getValidPasses } from './helpers/getValidPasses';
import { didWin } from './helpers/didWin';
import { useParams } from 'react-router-dom';
import './GameBoard.css'

const GameBoard = () => {
  const { gameId } = useParams();
  const [gameData, setGameData] = useState(null);
  const [activePiece, setActivePiece] = useState(null);
  const [originalSquare, setOriginalSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [hasMoved, setHasMoved] = useState(false);
  const [possiblePasses, setPossiblePasses] = useState([]);

  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const fetchedGame = await getGameById(gameId);
        setGameData(fetchedGame);
      } catch (error) {
        console.error('Error fetching game:', error);
      }
    };
    fetchGameData();
  }, [gameId]);

  const handlePieceClick = (piece) => {
    console.log(gameData);
    // Block action if not the player's turn or if the piece has the ball
    if (gameData.turnPlayer !== piece.color) {
      console.log("Not you're turn!");
      return;
    }
    const { row, col } = getKeyCoordinates(piece.position);
    if(piece.hasBall === false) {
    const moves = getPieceMoves(row, col, gameData.currentBoardStatus, hasMoved, originalSquare);
  
    // If clicking the same piece after it has moved, only show the original square as a possible move.
    // Otherwise, calculate and show all possible moves for the piece.
    if (activePiece && activePiece.position === piece.position) {
      if (hasMoved) {
        setPossibleMoves(moves);
      } else {
        setActivePiece(null);
        setPossibleMoves([]);
        setOriginalSquare(null);
      }
    } else if (activePiece && activePiece.position !== piece.position) {
      console.log("Make a move with your active piece first")
    } else if(!activePiece){
      setActivePiece(piece)
      setPossibleMoves(moves)
      setOriginalSquare(piece.position);
    }
  } else {
    if (activePiece && activePiece.position === piece.position) {
      setPossiblePasses([]);
      setActivePiece(null);
    } else {
      const passes = getValidPasses(row, col, gameData, gameData.currentBoardStatus);
      console.log(passes);
      setPossiblePasses(passes);
      setActivePiece(piece);
    }
  }

  };
  

  const handleCellClick = async (cellKey) => {
    const { row, col } = getKeyCoordinates(cellKey);
  
    if (!activePiece) {
      console.log("Select a piece first.");
      return;
    }
  
    const isPassAction = activePiece.hasBall && possiblePasses.includes(cellKey);
  
    if (isPassAction) {
      // Pass the ball logic
      let newGameBoard = { ...gameData.currentBoardStatus };
      newGameBoard[activePiece.position].hasBall = false;
      newGameBoard[cellKey].hasBall = true;
      setGameBoard(newGameBoard);
      updateGameModel({ ...gameModel, currentBoardStatus: newGameBoard });
      setActivePiece(null);
      setPossiblePasses([]);
    } else {
      const isLegalMove = possibleMoves.some(move => move.row === row && move.col === col);
      if (!isLegalMove) {
        console.log("Illegal Move");
        return;
      }
  
      // Move the piece if it's a legal move
      const newGameBoard = movePiece(activePiece.position, cellKey, gameData.currentBoardStatus);
      setGameBoard(newGameBoard);
      updateGameModel({ ...gameData, currentBoardStatus: newGameBoard }); //frontend

      try {
        const updatedGame = await updateGame(gameId, { ...gameModel, currentBoardStatus: newGameBoard }); //backend call
      } catch (error) {
        console.error('Failed to update game:', error);
      }
  
      if (hasMoved) {
        setActivePiece(null); // Deselect the piece after moving
        setPossibleMoves([]);
        setHasMoved(false); // Reset move state for the next turn
        setOriginalSquare(null); // Clear original square after completing the move
      } else {
        setHasMoved(true);
        activePiece.position = cellKey; // Update the position of the active piece
        setPossibleMoves([originalSquare]); // Allow moving back to the original square only
      }
    }
  };
  

  const handlePassTurn = async () => {
    updateGameModel({
      ...gameModel,
      turnPlayer: gameModel.turnPlayer === 'white' ? 'black' : 'white',
    });

    try {
      const updatedGame = await updateGame(gameId, updatedModel);
      updateGameModel(updatedGame);  // Update local state with new game data from server
    } catch (error) {
      console.error('Failed to update game:', error);
    }

    setActivePiece(null);
    setHasMoved(false);
    setPossibleMoves([]);
    setOriginalSquare(null);
  };

  const renderBoard = () => {
    if (!gameData) return null;
    return Object.entries(gameData.currentBoardStatus).map(([cellKey, cellData]) => {
      const { row, col } = getKeyCoordinates(cellKey);
      const isPossibleMove = possibleMoves.some(move => cellKey === toCellKey(move.row, move.col));
      const isPossiblePass = possiblePasses.some(pass => cellKey === pass);
      return (
        <GridCell
          key={cellKey}
          row={row}
          col={col}
          redHighlight={isPossibleMove}
          yellowHighlight={isPossiblePass}
          onClick={() => handleCellClick(cellKey)}
        >
          {cellData && (
            <Piece
              color={cellData.color}
              hasBall={cellData.hasBall}
              position={cellKey}
              onClick={() => handlePieceClick({ ...cellData, position: cellKey })}
            />
          )}
        </GridCell>
      );
    });
  };

  return (
    <div className={`game-board ${gameData && gameData.blackPlayerId === gameData.userId ? 'rotate-180' : ''}`}>
      <div className={`player-name ${gameData && gameData.whitePlayerId === gameData.userId ? 'top' : 'bottom'}`}>{gameData ? gameData.whitePlayerName : ''}</div>
      <GridContainer>
        {renderBoard()}
      </GridContainer>
      <div className={`player-name ${gameData && gameData.blackPlayerId === gameData.userId ? 'top' : 'bottom'}`}>{gameData ? gameData.blackPlayerName : 'Opponent'}</div>
      {gameData && didWin(gameData.currentBoardStatus) && <div className="winner-banner">{`${gameData.whitePlayerName} wins!`}</div>}
    </div>
  );
};

export default GameBoard;
