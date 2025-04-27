import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { StartOrJoinMultiplayerResponse } from '@/types/StartOrJoinMultiplayerResponse';
import type { ServerGame } from '@/types/ServerGame';
import { apiPost } from '@/services/apiClient';
import { getGameById, startSinglePlayerGame } from '../../services/gameService'
import { sendFeedbackEmail } from '../../services/mailService';
import { generateGuestUserID } from '../../utils/gameUtilities';
import Modal from '../modal/modal';
import './lobby.css';

function Lobby() {
  const navigate = useNavigate();
  const [showColorModal, setShowColorModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);  
  const [name, setName] = useState('');
  const [waitingForPlayer, setWaitingForPlayer] = useState(false);
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalId]);

  const handleJoinMultiplayerGame = async () => {
    try {
      const userId = localStorage.getItem('guestUserID') || generateGuestUserID();
      const result = await apiPost<StartOrJoinMultiplayerResponse>('/api/games/joinMultiplayerGame', {
        playerId: userId,
        playerName: name,
      });
  
      if (!result.success || !result.data) {
        console.error('Failed to join multiplayer:', result.error);
        alert('Failed to join multiplayer. Please try again.');
        return;
      }
  
      const { playerColor, game } = result.data;
      localStorage.setItem('userColor', playerColor);
  
      if (game.status === 'playing') {
        navigate(`/game/${game._id}`);
      } else {
        setWaitingForPlayer(true);
        const id = setInterval(() => pollGameStatus(game._id), 3000);
        setIntervalId(id);
      }
    } catch (error) {
      console.error('Failed to join multiplayer game:', error);
      alert('Unexpected error occurred.');
    }
  };
  
  const handleSelectColor = async (color: string) => {
    try {
      setShowColorModal(false);
  
      const userId = localStorage.getItem('guestUserID') || generateGuestUserID();
      localStorage.setItem('userColor', color);
  
      const result = await startSinglePlayerGame(userId, name, color);
  
      if (!result.success || !result.data) {
        console.error('Failed to start single-player game:', result.error);
        alert('Failed to start game. Please try again.');
        return;
      }
  
      const { game } = result.data;
      navigate(`/game/${game._id}`);
    } catch (error) {
      console.error('Failed to start single-player game:', error);
      alert('Unexpected error occurred.');
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

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      alert('Please enter a message.');
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      await sendFeedbackEmail(feedbackName, feedbackMessage);
  
      setSubmitSuccess(true);
      setFeedbackName('');
      setFeedbackMessage('');
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 1500);
      
      setTimeout(() => {
        setShowFeedbackModal(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  }; 

  const handleFeedbackSubmit = () => {
    console.log('Feedback submitted:', feedbackText);
    setFeedbackText('');
    setShowFeedbackModal(false);
    alert('Thank you for your feedback!');
  };

  return (
    <div className="page-container">
      <div className="lobby">
        <div className="header">
          <h1><span className='razzle-span'>Razzle</span> <span className='circle'></span> <span className='dazzel-span'>Dazzle</span></h1>
        </div>
      <div className='lobby-content'>
        <div className="input-container">
          <label htmlFor="name"><i className="fas fa-user"></i> {name}</label>
          <input type="text" id="name" placeholder="Enter Your Name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="button-group">
          <button className="button" onClick={handleJoinMultiplayerGame}>
            <i className="fas fa-users"></i> Multiplayer Mode
          </button>
          <button className="button" onClick={handleSinglePlayerGame}>
            <i className="fas fa-user"></i> Single Player Mode
          </button>
        </div>
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
          <h2 className='gamerules-title'>Game Rules</h2>
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

        <button className="floating-feedback-button" onClick={() => setShowFeedbackModal(true)}>
            📝 Feedback
        </button>
        {/* Feedback Modal */}
        {showFeedbackModal && (
          <Modal>
            <h2>Leave Feedback</h2>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Type your feedback here..."
              className="feedback-textarea"
            />
            <div className="feedback-buttons">
              <button className="submit-button" onClick={handleFeedbackSubmit}>Submit</button>
              <button className="cancel-button" onClick={() => setShowFeedbackModal(false)}>Cancel</button>
            </div>
          </Modal>
        )}
        {showFeedbackModal && (
  <Modal>
    <h2>Send Feedback</h2>
    <input
      type="text"
      placeholder="Your name (optional)"
      value={feedbackName}
      onChange={(e) => setFeedbackName(e.target.value)}
      className="feedback-input"
    />
    <textarea
      placeholder="Your message"
      value={feedbackMessage}
      onChange={(e) => setFeedbackMessage(e.target.value)}
      className="feedback-textarea"
      rows={5}
    />
    <div style={{ marginTop: '1rem' }}>
      <button
        className="button"
        onClick={handleSubmitFeedback}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Sending...' : 'Submit'}
      </button>
      <button
        className="button"
        style={{ backgroundColor: '#ccc', color: '#333', marginLeft: '1rem' }}
        onClick={() => setShowFeedbackModal(false)}
      >
        Cancel
      </button>
    </div>
    {submitSuccess && <p style={{ marginTop: '1rem', color: 'green' }}>Thank you for your feedback!</p>}
  </Modal>
)}

    </div>
  );
}

export default Lobby;
