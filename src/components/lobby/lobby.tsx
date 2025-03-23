import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinQueue, getGameById, startSinglePlayerGame } from '../../services/gameService';
import { generateGuestUserID } from '../../utils/gameUtilities';
import Modal from '../modal/modal';
import './lobby.css';

function Lobby() {
  const navigate = useNavigate();
  const [showColorModal, setShowColorModal] = useState(false);
  const [name, setName] = useState('');
  const [waitingForPlayer, setWaitingForPlayer] = useState(false);
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalId]);

  const handleJoinGame = async () => {
    try {
      const userId = localStorage.getItem('guestUserID') || generateGuestUserID();
      const data = await joinQueue(userId, name);
      localStorage.setItem('userColor', data.playerColor);

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

  const handleSelectColor = async (color) => {
    try {
      setShowColorModal(false);
      const userId = localStorage.getItem('guestUserID') || generateGuestUserID();
      localStorage.setItem('userColor', color);
      const data = await startSinglePlayerGame(userId, name, color);
      navigate(`/game/${data.game._id}`);
    } catch (error) {
      console.error('Failed to join game:', error);
    }
  };

  const handleSinglePlayerGame = () => {
    setShowColorModal(true);
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
    <div className="lobby">
      <div className="header">
        <h1>Welcome to the Game Lobby</h1>
      </div>
      <div className="input-container">
        <label htmlFor="name">Enter Your Name:</label>
        <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <button className="button multiplayer" onClick={handleJoinGame}>
        Multiplayer Mode
      </button>
      {waitingForPlayer && (
        <Modal>
          {' '}
          <h2>Waiting for another player to join...</h2>{' '}
        </Modal>
      )}
      <button className="button singleplayer" onClick={handleSinglePlayerGame}>
        Single Player Mode
      </button>
      {showColorModal && (
        <Modal>
          <h2> Choose Your Color</h2>
          <button className="color-button white" onClick={() => handleSelectColor('white')}>
            Play as White
          </button>
          <button className="color-button black" onClick={() => handleSelectColor('black')}>
            Play as Black
          </button>
        </Modal>
      )}
      <div className="rules">
        <h2>Game Rules</h2>

        <div className="section">
          <p>
            <strong>Game Objective:</strong> The goal is to move one of your pieces holding the ball
            to the opponent&apos;s back rank.
          </p>
        </div>

        <div className="section">
          <p>
            <strong>Pieces and Movement:</strong>
          </p>
          <ul>
            <li>Each player has 4 pieces.</li>
            <li>All pieces move like knights in chess (an L-shape).</li>
            <li>The active piece (the piece you select) will be highlighted in blue.</li>
          </ul>
          <div className="image-container">
            <img
              src="/images/activePieceHighlighted.png"
              alt="Highlighted Active Piece"
              className="static-image"
            />
          </div>
        </div>

        <div className="section">
          <p>
            <strong>Piece Movement:</strong>
          </p>
          <p>
            The piece you select will be highlighted in blue. Click on a piece to select it, then
            click on a valid destination square to move it. The valid destination squares will be
            highlighted in red.
          </p>
          <div className="animation-container">
            <img src="/images/startingPiece.png" alt="Starting Piece" className="move-animation" />
          </div>
        </div>

        <div className="section">
          <p>
            <strong>The Ball:</strong>
          </p>
          <ul>
            <li>One piece on each side starts with a metal ball.</li>
            <li>The piece holding the ball cannot move but can pass the ball to another piece.</li>
          </ul>
          <div className="image-container">
            <img
              src="/images/startPosition.png"
              alt="Start Position"
              className="static-image"
              id="startPos"
            />
          </div>
        </div>

        <div className="section">
          <p>
            <strong>Passing the Ball:</strong>
          </p>
          <ul>
            <li>
              The ball can be passed to any of the player&apos;s pieces that are laterally or
              diagonally adjacent.
            </li>
            <li>The path for passing the ball must be clear of opponent&apos;s pieces.</li>
          </ul>
          <div className="animation-container">
            <img src="/images/pass1.png" alt="Passing Ball" className="pass-animation" />
          </div>
        </div>
        <div className="section">
          <p>
            <strong>Gameplay:</strong>
          </p>
          <ul>
            <li>On a turn, a player can either move one piece or pass the ball.</li>
            <li>The turn ends when the player presses the &quot;Pass Turn&quot; button.</li>
            <li>Turns alternate between players.</li>
          </ul>
          <div className="image-container">
            <img
              src="/images/passTurn.png"
              alt="Pass Turn"
              className="static-image"
              id="passTurn"
            />
          </div>
        </div>

        <div className="section">
          <p>
            <strong>Winning the Game:</strong> The first player to move a piece holding the ball to
            the opponent&apos;s back rank wins the game.
          </p>
          <div className="image-container">
            <img src="/images/win.png" alt="Winning Move" className="static-image" id="win" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Lobby;
