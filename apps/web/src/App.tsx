import { NavLink, Route, Routes, useLocation } from 'react-router-dom';

import { AudienceVoting } from './pages/AudienceVoting';
import { ControlDeck } from './pages/ControlDeck';
import { DisplayBoard } from './pages/DisplayBoard';
import { SubmissionPortal } from './pages/SubmissionPortal';

function App() {
  const location = useLocation();

  if (location.pathname === '/display') {
    return <DisplayBoard />;
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <h1>Waifu Panel</h1>
          <p className="muted">Your waifu sucks. We&apos;re here to prove your questionable taste.</p>
        </div>
        <nav>
          <NavLink to="/" end>
            Submission
          </NavLink>
          <NavLink to="/audience">Audience</NavLink>
          <NavLink to="/display">Display</NavLink>
          <NavLink to="/control">Control</NavLink>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<SubmissionPortal />} />
          <Route path="/audience" element={<AudienceVoting />} />
          <Route path="/display" element={<DisplayBoard />} />
          <Route path="/control" element={<ControlDeck />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
