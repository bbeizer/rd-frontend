import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createGame } from '../services/gameService';

function Home() {
  const navigate = useNavigate();

  const handleCreateGame = async () => {
    try {
      const game = await createGame({}); // Assuming no gameData is required to create a game
      navigate(`/game/${game._id}`); // Navigate to the game board with the new game ID
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  };

  return (
    <div className="home">
      <h1>Welcome to the Game Lobby</h1>
      <button onClick={handleCreateGame}>Create New Game</button>
      {/* You can also list existing games here and navigate to them similarly */}
    </div>
  );
}

export default Home;

