import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinQueue, getGameById } from '../../services/gameService';
import { generateUserID } from '../../utils/gameUtilities';
import './home.css';

function Home() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [waitingForPlayer, setWaitingForPlayer] = useState(false);

  const handleJoinGame = async () => {
    try {
      const userId = generateUserID()
      const game = await joinQueue(userId, name);
      if (game.status === 'playing') {
        navigate(`/game/${game._id}`);
      } else {
        setWaitingForPlayer(true);
        checkGameStatus(game._id);
      }
    } catch (error) {
      console.error('Failed to join game:', error);
    }
  };

  const checkGameStatus = async (gameId) => {
    try {
      const intervalId = setInterval(async () => {
        const game = await getGameById(gameId);
        if (game.status === 'playing') {
          clearInterval(intervalId);
          navigate(`/game/${game._id}`);
        }
      }, 3000); // Poll every 3 seconds
    } catch (error) {
      console.error('Error polling game status:', error);
    }
  };

  return (
    <div className="home">
      <div className="header">
        <h1>Welcome to the Game Lobby</h1>
      </div>
      <div className="input-container">
        <label htmlFor="name">Enter Your Name:</label>
        <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <button className="join-button" onClick={handleJoinGame}>Join Game</button>
      {waitingForPlayer && <p className="waiting-text">Waiting for another player to join...</p>}
    </div>
  );
}

export default Home;
