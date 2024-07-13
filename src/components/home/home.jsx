import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinQueue, getGameById } from '../../services/gameService';
import { generateUserID } from '../../utils/gameUtilities';
import './home.css';

function Home() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [waitingForPlayer, setWaitingForPlayer] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [gameId, setGameId] = useState(null);

  useEffect(() => {
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalId]);

  const clearGames = async()=> {
    const response = await fetch(`http://localhost:3000/api/games`,  {
      method: 'DELETE'
  })
}
console.log("Current name:", name); // Check the current state before the request
const handleJoinGame = async () => {
  try {
    const userId = generateUserID();
    const data = await joinQueue(userId, name);  // Get the full response including game and playerColor
    setGameId(data.game._id);
    localStorage.setItem('userColor', data.playerColor);  // Correctly store the player color

    if (data.game.status === 'playing') {
      navigate(`/game/${data.game._id}`);
    } else {
      setWaitingForPlayer(true);
      const id = setInterval(() => pollGameStatus(data.game._id), 3000);
      setIntervalId(id);
    }
  } catch (error) {
    console.error('Failed to join game:', error);
  }
};

  const pollGameStatus = async (id) => {
    try {
      const game = await getGameById(id);
      if (game.status === 'playing') {
        clearInterval(intervalId);
        navigate(`/game/${game._id}`);
      }
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
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <button onClick={clearGames}>DELETE</button>
      <button className="join-button" onClick={handleJoinGame}>Join Game</button>
      {waitingForPlayer && (
        <p className="waiting-text">Waiting for another player to join...</p>
      )}
    </div>
  );
}

export default Home;
