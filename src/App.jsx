import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GameBoard from './components/game-board/GameBoard';
import { initializeGameModel } from './models/gameModel';
import Home from './components/home/home';

function App() {
  const [gameModel, setGameModel] = useState(initializeGameModel());

  const updateGameModel = async (gameId) => {
    try {
        const fetchedGame = await getGameById(gameId);
        setGameModel(fetchedGame);
    } catch (error) {
        console.error("Failed to fetch game data:", error);
    }
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
              />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
