import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink, Route, Routes } from 'react-router-dom';
import { AudienceVoting } from './pages/AudienceVoting';
import { ControlDeck } from './pages/ControlDeck';
import { DisplayBoard } from './pages/DisplayBoard';
import { SubmissionPortal } from './pages/SubmissionPortal';
function App() {
    return (_jsxs("div", { className: "app-shell", children: [_jsxs("header", { className: "top-bar", children: [_jsxs("div", { children: [_jsx("h1", { children: "Waifu Panel" }), _jsx("p", { className: "muted", children: "Live panel tooling for roasting everyone's questionable taste." })] }), _jsxs("nav", { children: [_jsx(NavLink, { to: "/", end: true, children: "Submission" }), _jsx(NavLink, { to: "/audience", children: "Audience" }), _jsx(NavLink, { to: "/display", children: "Display" }), _jsx(NavLink, { to: "/control", children: "Control" })] })] }), _jsx("main", { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(SubmissionPortal, {}) }), _jsx(Route, { path: "/audience", element: _jsx(AudienceVoting, {}) }), _jsx(Route, { path: "/display", element: _jsx(DisplayBoard, {}) }), _jsx(Route, { path: "/control", element: _jsx(ControlDeck, {}) })] }) })] }));
}
export default App;
