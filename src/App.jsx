import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GameBoard from './components/game-board/GameBoard';
import { initializeGameModel } from './models/gameModel';
import Home from './components/home/home';

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
    setGameModel((prevModel) => ({
      ...prevModel,
      ...updatedModel,
    }));
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Define a dynamic route for games, using the game ID */}
          <Route
            path="/game/:gameId"
            element={
              <GameBoard
                gameModel={gameModel}
                updateGameModel={updateGameModel}
                pendingMove={pendingMove}
                setActivePiece={setActivePiece} // Assuming you want to manage the active piece from App
                activePiece={activePiece}
              />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
