import { useState, useEffect} from 'react';
import './GameBoard.css';
import Confetti from 'react-confetti';
import GridCell from '../grid/grid-cell/GridCell';
import Modal from '../modal/modal';
import Piece from '../piece/Piece';
import GridContainer from '../grid/grid-container/GridContainer';
import PlayerInfoBar from '../playerInfoBar/playerInfoBar';
import { updateGame } from '../../services/gameService';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { fetchGame } from './helpers/fetchGame';
import { updateGameState } from './helpers/updateGameState';
import { getAIMove } from '../../services/aiService';
import { getKeyCoordinates } from '../../utils/gameUtilities'
const GameBoard = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState({
    gameId: gameId,
    gameType: null,
    gameData: null,
    isUserTurn: true,
    activePiece: null,
    possibleMoves: [],
    movedPiece: null,
    movedPieceOriginalPosition: null,
    possiblePasses: [],
    playerColor: localStorage.getItem('userColor'),
    winner: null
  });
  const rotationStyle = gameState.playerColor === 'black' ? 'rotate(180deg)' : 'rotate(0deg)';
  const [intervalId, setIntervalId] = useState(null);
  const isUserWhite = gameState.playerColor === 'white';
  const currentPlayerName = gameState.gameData ? (isUserWhite ? gameState.gameData.whitePlayerName : gameState.gameData.blackPlayerName) : 'Loading...';
  const opponentPlayerName = gameState.gameData ? (!isUserWhite ? gameState.gameData.whitePlayerName : gameState.gameData.blackPlayerName) : 'Loading...';
  useEffect(() => {
    console.log("UseEffect hit");
    if (!gameId) return; // Exit if gameId is not defined

    const pollGameData = async () => {
        const playerColor = gameState.gameType === 'single' ? 'white' : localStorage.getItem('userColor');
        const gameData = await fetchGame(gameId, setGameState, playerColor);

      // Wait until `gameData` is ready before touching `isUserTurn`
        if (!gameData) {
            console.log("gameData is still undefined, waiting...");
            return;  // Just chill and wait
        }

        setGameState(prevState => ({
            ...prevState,
            gameData: gameData,
            isUserTurn: gameState.gameType === 'single' ? true :
                        gameData.currentPlayerTurn ? gameData.currentPlayerTurn === playerColor : prevState.isUserTurn,
        }));
    };

    // Perform the initial fetch
    pollGameData();

    // Multiplayer polling
    if (gameState.gameType === 'multiplayer' && !gameState.isUserTurn && !intervalId) {
        const newIntervalId = setInterval(pollGameData, 3000);
        setIntervalId(newIntervalId);
    }

    // Cleanup polling on unmount
    return () => {
        if (intervalId) {
            clearInterval(intervalId);
            setIntervalId(null);
        }
    };
}, [gameId, gameState.isUserTurn, gameState.gameType, intervalId]);
  
  const handleClick = async (event) => {
    event.stopPropagation();
    const cellKey = event.currentTarget.id;
    const newState = updateGameState(cellKey, gameState);
    setGameState(newState);

    if (newState.winner) {
      handleGameEnd(newState.winner);
    }

    try {
      await updateGame(gameId, newState);
    } catch (error) {
      console.error('Failed to update game on server:', error);
    }
  };

  const handlePassTurn = async () => {
    console.log("Handle pass turn hit")
    const currentPlayerColor = localStorage.getItem('userColor');
    const nextPlayerTurn = currentPlayerColor === 'white' ? 'black' : 'white';
    try {
      let updatedGameData;
  
      if (gameState.gameType === 'multiplayer') {
        // Multiplayer: Update turn and clear temporary states
        updatedGameData = {
          ...gameState.gameData,
          currentPlayerTurn: nextPlayerTurn,
          activePiece: null,
          movedPiece: null,
          originalSquare: null,
          possibleMoves: [],
          possiblePasses: [],
        };
        setGameState((prevState) => ({
          ...prevState,
          gameData: updatedGameData,
          isUserTurn: updatedGameData.currentPlayerTurn === currentPlayerColor,
          movedPiece: null,
          activePiece: null,
          originalSquare: null,
          possibleMoves: [],
          possiblePasses: [],
        }));
      } else { 
        const aiMove = await getAIMove(gameState);
        updatedGameData = {
          ...gameState.gameData,
          currentBoardStatus: aiMove.gameData.currentBoardStatus,
          currentPlayerTurn: true,
          activePiece: null,
          movedPiece: null,
          originalSquare: null,
          possibleMoves: [],
          possiblePasses: [],
        };
        // Update game state
        setGameState((prevState) => ({
          ...prevState,
          gameData: updatedGameData,
          isUserTurn: true, // Always user's turn after AI move
          movedPiece: null,
          activePiece: null,
          originalSquare: null,
          possibleMoves: [],
          possiblePasses: [],
        }));
        
      }
      await updateGame(gameId, updatedGameData);
  
      // Manage polling for multiplayer
      if(gameState.gameType === 'multiplayer'){
      managePolling(updatedGameData);
      }
    } catch (error) {
      console.error('Error handling pass turn:', error);
    }
  };
  
  
  const managePolling = (updatedGame) => {
    if (updatedGame.currentPlayerTurn === localStorage.getItem('userColor')) {
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
    } else if (!intervalId && updatedGame.gameType === 'multiplayer') {
      const newIntervalId = setInterval(() => {
        fetchGame(gameId, setGameState, localStorage.getItem('userColor'));
      }, 3000);
      setIntervalId(newIntervalId);
    }
  };
  
  const handleGameEnd = async (winnersName) => {
    clearInterval(intervalId); // Stop polling
    setGameState((prevState) => ({
      ...prevState,
      gameData: { 
        ...prevState.gameData, 
        status: 'completed', 
        winner: winnersName 
      },
      winner: winnersName, // Set the winner in the local state
    }));
  
    try {
      // Update backend to persist game completion, winner's name, and final board state
      await updateGame(gameId, { 
        status: 'completed', 
        winner: winnersName, 
        currentBoardStatus: gameState.gameData.currentBoardStatus // Include the final board state
      });
    } catch (error) {
      console.error('Failed to update game:', error);
    }
  };
  

  const renderBoard = () => {
    console.log("Rendering the board");
    if (!gameState.gameData?.currentBoardStatus) {
      return <p>Loading game board...</p>;
    }
  
    return (
      <>
        {Object.entries(gameState.gameData.currentBoardStatus)
  .sort(([keyA], [keyB]) => {
    // Sort keys by row descending, then column ascending
    const rowA = parseInt(keyA[1], 10);
    const rowB = parseInt(keyB[1], 10);
    const colA = keyA.charCodeAt(0);
    const colB = keyB.charCodeAt(0);
    return rowB - rowA || colA - colB; // Sort by row descending, then column ascending
  })
  .map(([cellKey, cellData]) => {
    const coords = getKeyCoordinates(cellKey);
    console.log(`Cell: ${cellKey}, Row:${coords.row} Column:${coords.col}`);
    const isPossibleMove = gameState.possibleMoves.includes(cellKey);
    const isPossiblePass = gameState.possiblePasses.includes(cellKey);
    let isActivePiece = null;

    if (gameState.activePiece) {
      isActivePiece = gameState.activePiece.position === cellKey;
    }

    return (
      <GridCell
        key={cellKey}
        row={parseInt(cellKey[1], 10) - 1}
        col={cellKey.charCodeAt(0) - 'a'.charCodeAt(0)}
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
            onClick={(e) => {
              e.stopPropagation();
              handleClick(e);
            }}
          />
        )}
      </GridCell>
    );
  })}

        {console.log(gameState)}
      </>
    );
  };
  
  

  if (!gameState.gameData) {
    return <div>Loading game data...</div>;
  }
  return (
    <div className="game-container">
      {gameState.gameData.status === 'completed' && <Confetti />}
      <PlayerInfoBar
        playerName={opponentPlayerName}
      />
      <div className="board-and-info">
        <div className="board-container" style={{ transform: rotationStyle }}>
          <GridContainer>{renderBoard()}</GridContainer>
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
