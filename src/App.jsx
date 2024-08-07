import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GameBoard from './components/game-board/GameBoard';
import { initializeGameModel } from './models/gameModel';
import Home from './components/home/home';

function App() {
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
              />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
