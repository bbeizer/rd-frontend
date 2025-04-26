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
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);

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
        navigate(`/game/${data._id}`);
      } else {
        setWaitingForPlayer(true);
        const id = setInterval(() => pollGameStatus(data.game._id), 3000);
        setIntervalId(id);
      }
    } catch (error) {
      console.error('Failed to join game:', error);
    }
  };

  const handleSelectColor = async (color: string) => {
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

  const pollGameStatus = async (id: string) => {
    try {
      const game = await getGameById(id);
      if (game.status === 'playing') {
        if (intervalId !== null) {
          clearInterval(intervalId);
        }
        navigate(`/game/${game._id}`);
      }
    } catch (error) {
      console.error('Error polling game status:', error);
    }
  };

  return (
    <div className="page-container">
      <div className="lobby">
        <div className="header">
          <h1>Welcome to Razzle Dazzle</h1>
        </div>
        <div className="input-container">
          <label htmlFor="name">Enter Your Name:</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="button-group">
          <button className="floating-feedback-button" onClick={() => window.open('https://your-feedback-form-link.com', '_blank')}>
            📝 Feedback
          </button>
          <button className="button" onClick={handleJoinGame}>Multiplayer Mode</button>
          <button className="button" onClick={handleSinglePlayerGame}>Single Player Mode</button>
        </div>
        {waitingForPlayer && (
          <Modal>
            <h2>Waiting for another player to join...</h2>
          </Modal>
        )}
        {showColorModal && (
          <Modal>
            <h2>Choose Your Color</h2>
            <button className="color-button white" onClick={() => handleSelectColor('white')}>Play as White</button>
            <button className="color-button black" onClick={() => handleSelectColor('black')}>Play as Black</button>
          </Modal>
        )}
        <div className="rules">
          <h2>Game Rules</h2>
          <div className="section">
            <p><strong>Game Objective:</strong> The goal is to move one of your pieces holding the ball to the opponent's back rank.</p>
          </div>
          <div className="section">
            <p><strong>Pieces and Movement:</strong></p>
            <ul>
              <li>Each player has 4 pieces.</li>
              <li>All pieces move like knights in chess (an L-shape).</li>
              <li>The active piece (the piece you select) will be highlighted in blue.</li>
            </ul>
            <div className="image-container">
              <img src="/images/activePieceHighlighted.png" alt="Highlighted Active Piece" className="static-image" />
            </div>
          </div>
          <div className="section">
            <p><strong>Piece Movement:</strong></p>
            <p>The piece you select will be highlighted in blue. Click a piece to select it, then click a valid square to move. Valid squares are highlighted in red.</p>
            <div className="animation-container">
              <img src="/images/startingPiece.png" alt="Starting Piece" className="move-animation" />
            </div>
          </div>
          <div className="section">
            <p><strong>The Ball:</strong></p>
            <ul>
              <li>One piece on each side starts with a metal ball.</li>
              <li>The piece holding the ball cannot move but can pass the ball to another piece.</li>
            </ul>
            <div className="image-container">
              <img src="/images/startPosition.png" alt="Start Position" className="static-image" />
            </div>
          </div>
          <div className="section">
            <p><strong>Passing the Ball:</strong></p>
            <ul>
              <li>The ball can be passed to any adjacent piece (lateral or diagonal).</li>
              <li>The path must be clear of opponent's pieces.</li>
            </ul>
            <div className="animation-container">
              <img src="/images/pass1.png" alt="Passing Ball" className="pass-animation" />
            </div>
          </div>
          <div className="section">
            <p><strong>Gameplay:</strong></p>
            <ul>
              <li>Move a piece or pass the ball on your turn.</li>
              <li>Press "Pass Turn" to end your move.</li>
              <li>Turns alternate between players.</li>
            </ul>
            <div className="image-container">
              <img src="/images/passTurn.png" alt="Pass Turn" className="static-image" />
            </div>
          </div>
          <div className="section">
            <p><strong>Winning the Game:</strong> Move a piece holding the ball to the opponent's back rank to win.</p>
            <div className="image-container">
              <img src="/images/win.png" alt="Winning Move" className="static-image" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Lobby;
