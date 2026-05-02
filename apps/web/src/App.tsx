import { NavLink, Route, Routes, useLocation } from 'react-router-dom';

import { AudienceVoting } from './pages/AudienceVoting';
import { ControlDeck } from './pages/ControlDeck';
import { DisplayBoard } from './pages/DisplayBoard';
import { SubmissionPortal } from './pages/SubmissionPortal';
import { APP_ROUTES } from './routes';

function App() {
  const location = useLocation();

  if (location.pathname === APP_ROUTES.display) {
    return <DisplayBoard />;
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <h1>Your Waifu Ain't Shit!</h1>
          <p className="muted">Your waifu sucks. We&apos;re here to prove your questionable taste.</p>
        </div>
        <nav>
          <NavLink to={APP_ROUTES.submission} end>
            Submit
          </NavLink>
          <NavLink to={APP_ROUTES.audience}>Vote</NavLink>
          {/*<NavLink to="/display">Display</NavLink>*/}
          {/*<NavLink to="/control">Control</NavLink>*/}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path={APP_ROUTES.submission} element={<SubmissionPortal />} />
          <Route path={APP_ROUTES.audienceAlias} element={<AudienceVoting />} />
          <Route path={APP_ROUTES.audience} element={<AudienceVoting />} />
          <Route path={APP_ROUTES.display} element={<DisplayBoard />} />
          <Route path={APP_ROUTES.control} element={<ControlDeck />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
