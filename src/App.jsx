import React from 'react';
import { initializeGameModel } from './models/gameModel';
import GameBoard from './components/game-board/GameBoard';

function App() {
  const gameModel = initializeGameModel();
  return (
    <div className="App">
      <GameBoard gameModel= {gameModel}/> 
    </div>
  );
}

export default App;