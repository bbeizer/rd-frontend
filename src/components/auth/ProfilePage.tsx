import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getUserGames } from '@/services/authService';
import type { GameSummary } from '@/types/GameSummary';
import './auth.css';

function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout, updateUser, deleteAccount } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [games, setGames] = useState<GameSummary[]>([]);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      setNewUsername(user.username);
      loadGames();
    }
  }, [user]);

  const loadGames = async () => {
    if (!user) return;
    const result = await getUserGames(user._id);
    if (result.success && result.data) {
      setGames(result.data);
    }
  };

  const handleUpdateUsername = async () => {
    if (newUsername.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    setError('');
    setIsUpdating(true);
    const result = await updateUser({ username: newUsername });
    setIsUpdating(false);
    if (result.success) {
      setIsEditing(false);
    } else {
      setError(result.error || 'Failed to update username');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    const result = await deleteAccount();
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Failed to delete account');
    }
  };

  const getOpponentName = (game: GameSummary) => {
    if (game.gameType === 'singleplayer') {
      const label = game.difficulty ? `AI (${game.difficulty})` : 'AI';
      return label;
    }
    if (game.whitePlayerName === user?.username) {
      return game.blackPlayerName;
    }
    return game.whitePlayerName;
  };

  const getResult = (game: GameSummary) => {
    return game.winner === user?.username ? 'Won' : 'Lost';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="auth-page">
      <div className="auth-container profile-container">
        <h1 className="auth-title">Profile</h1>

        <div className="profile-section">
          <div className="profile-field">
            <span className="profile-label">Email:</span>
            <span className="profile-value">{user.email}</span>
          </div>

          <div className="profile-field">
            <span className="profile-label">Username:</span>
            {isEditing ? (
              <div className="profile-edit">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="profile-input"
                />
                <button
                  onClick={handleUpdateUsername}
                  className="profile-save-btn"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setNewUsername(user.username);
                    setError('');
                  }}
                  className="profile-cancel-btn"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="profile-edit">
                <span className="profile-value">{user.username}</span>
                <button onClick={() => setIsEditing(true)} className="profile-edit-btn">
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>

        {error && <p className="auth-error">{error}</p>}

        <div className="profile-section">
          <h2 className="profile-subtitle">Game History</h2>
          {games.length > 0 ? (
            <ul className="game-history-list">
              {games.map((game) => (
                <li key={game._id} className="game-history-item">
                  <div className="game-history-info">
                    <span className="game-history-opponent">vs {getOpponentName(game)}</span>
                    <span
                      className={`game-history-result ${getResult(game) === 'Won' ? 'result-won' : 'result-lost'}`}
                    >
                      {getResult(game)}
                    </span>
                    <span className="game-history-meta">
                      {game.moveHistory?.length ? `${game.moveHistory.length} turns \u00b7 ` : ''}
                      {formatDate(game.createdAt)}
                    </span>
                  </div>
                  <div className="game-history-actions">
                    <button
                      onClick={() => navigate(`/game/${game._id}/replay`)}
                      className="view-game-btn"
                    >
                      View
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-games">No games played yet</p>
          )}
        </div>

        <div className="profile-actions">
          <button onClick={() => navigate('/')} className="auth-button back-lobby-btn">
            Back to Lobby
          </button>

          <button onClick={handleLogout} className="auth-button logout-btn">
            Logout
          </button>

          {showDeleteConfirm ? (
            <div className="delete-confirm">
              <p>Are you sure you want to delete your account?</p>
              <button onClick={handleDeleteAccount} className="delete-confirm-btn">
                Yes, Delete
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="delete-cancel-btn">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setShowDeleteConfirm(true)} className="delete-account-btn">
              Delete Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
