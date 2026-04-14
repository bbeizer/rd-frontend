import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import GameBoard from './components/GameBoard/GameBoard';
import Lobby from './components/lobby/Lobby';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import ProfilePage from './components/auth/ProfilePage';
import ReplayViewer from './components/ReplayViewer/ReplayViewer';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Lobby />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            {/* Define a dynamic route for games, using the game ID */}
            <Route path="/game/:gameId" element={<GameBoard />} />
            <Route path="/game/:gameId/replay" element={<ReplayViewer />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
