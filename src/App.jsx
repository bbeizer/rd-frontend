import React, { useState } from 'react';
import GameBoard from './components/game-board/GameBoard';
import { initializeGameModel } from './models/gameModel';

function App() {
  const [gameModel, setGameModel] = useState(initializeGameModel());
  const [pendingMove, setPendingMove] = useState({
    hasMovedAPiece: false,
    move: {
      startPosition: null,
      endPosition: null,
    },
    pass: {
      startPosition: null,
      endPosition: null,
    },
  });
  const [activePiece, setActivePiece] = useState(null);

  const updateGameModel = (updatedModel) => {
    setGameModel(prevModel => ({
        ...prevModel,
        ...updatedModel,
    }));
};

  // Similarly, you can create functions to update `pendingMove` and `activePiece` as needed

  return (
    <div className="App">
      <GameBoard
        gameModel={gameModel}
        updateGameModel={updateGameModel} // Pass this function to GameBoard for updates
        pendingMove={pendingMove}
      />
    </div>
  );
}

export default App;
