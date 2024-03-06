import React from 'react';
import { initializeGameModel } from './models/gameModel';
import GameBoard from './components/game-board/GameBoard';

const pendingMove = {
  hasMovedAPiece: false,
  move: {
    startPosition: null,
    endPosition: null
  },
  pass: {
    startPosition: null,
    endPosition: null
  }
};

const activePiece = null;

function App() {
  const gameModel = initializeGameModel();
  return (
    <div className="App">
      <GameBoard gameModel= {gameModel} pendingMove={pendingMove} activePiece={activePiece} /> 
    </div>
  );
}

export default App;