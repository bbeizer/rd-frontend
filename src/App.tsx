import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GameBoard from './components/GameBoard/GameBoard';
import Lobby from './components/lobby/Lobby';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Lobby />} />
          {/* Define a dynamic route for games, using the game ID */}
          <Route path="/game/:gameId" element={<GameBoard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
