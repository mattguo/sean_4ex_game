import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GameHall from './GameHall';
import JoinRoom from './JoinRoom';
import GamePage from './GamePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GameHall />} />
        <Route path="/join/:code" element={<JoinRoom />} />
        <Route path="/game/:code" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
