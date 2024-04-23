import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  const handleStartNewGame = () => {
    // Here you would typically make an API call to your backend to create a new game
    // and receive a gameId in response. For this example, let's use a placeholder.
    const newGameId = '123';
    
    // After creating the game, navigate to the game board for the new game
    navigate(`/game/${newGameId}`);
  };

  return (
    <div className="home">
      <h1>Welcome to the Game Lobby</h1>
      <button onClick={handleStartNewGame}>Start New Game</button>
      {/* More functionality can be added here, like listing existing games */}
    </div>
  );
}

export default Home;
