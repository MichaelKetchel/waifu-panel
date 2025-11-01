import { NavLink, Route, Routes } from 'react-router-dom';

import { AudienceVoting } from './pages/AudienceVoting';
import { ControlDeck } from './pages/ControlDeck';
import { DisplayBoard } from './pages/DisplayBoard';
import { SubmissionPortal } from './pages/SubmissionPortal';

function App() {
  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <h1>Waifu Panel</h1>
          <p className="muted">Live panel tooling for roasting everyone&apos;s questionable taste.</p>
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
