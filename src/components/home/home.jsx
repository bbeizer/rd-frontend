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
      <button className="join-button" onClick={handleJoinGame}>Join Game</button>
      {waitingForPlayer && (
        <p className="waiting-text">Waiting for another player to join...</p>
      )}
      <div class="rules">
        <h2>Game Rules</h2>
        <p><strong>Game Objective:</strong> The goal is to move one of your pieces holding the ball to the opponent's back rank.</p>
        <p><strong>Pieces and Movement:</strong></p>
        <ul>
          <li>Each player has 4 pieces.</li>
          <li>All pieces move like knights in chess (an L-shape).</li>
            <div className="animation-container">
              <img src="/images/attemptMove.png" alt="Attempt Move" className="move-animation" id="moveStep1"></img>
              <img src="/images/makeMove.png" alt="Make Move" className="move-animation" id="moveStep2"></img>
            </div>
        </ul>
        <p><strong>The Ball:</strong></p>
        <ul>
          <li>One piece on each side starts with a metal ball.</li>
          <li>The piece holding the ball cannot move but can pass the ball to another piece.</li>
        </ul>
        <p><strong>Passing the Ball:</strong></p>
        <ul>
          <li>The ball can be passed to any of the player's pieces that are laterally or diagonally adjacent.</li>
          <li>The path for passing the ball must be clear of opponent's pieces.</li>
        </ul>
        <p><strong>Gameplay:</strong></p>
        <ul>
          <li>On a turn, a player can either move one piece or pass the ball.</li>
          <li>The turn ends when the player presses the "End Turn" button.</li>
          <li>Turns alternate between players.</li>
        </ul>
        <p><strong>Winning the Game:</strong> The first player to move a piece holding the ball to the opponent's back rank wins the game.</p>
      </div>

    </div>
  );
}

export default Home;
