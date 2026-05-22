import { useState, lazy, Suspense } from 'react';
import { api } from './api';
import { Toast } from './components/Toast';
import { AuthPage } from './pages/AuthPage';

const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Jobs = lazy(() => import('./pages/Jobs').then(m => ({ default: m.Jobs })));
const Upload = lazy(() => import('./pages/Upload').then(m => ({ default: m.Upload })));
const Candidates = lazy(() => import('./pages/Candidates').then(m => ({ default: m.Candidates })));

export function App() {
  const [auth, setAuth] = useState(() => {
    const t = localStorage.getItem('jwt_token');
    const u = localStorage.getItem('jwt_user');
    if (t && u) { api.setToken(t); return JSON.parse(u); }
    return null;
  });
  const [page, setPage] = useState('dashboard');
  const [jobForCandidates, setJobForCandidates] = useState(null);

  const login = (data) => {
    api.setToken(data.token);
    localStorage.setItem('jwt_token', data.token);
    localStorage.setItem('jwt_user', JSON.stringify(data));
    setAuth(data);
  };

  const logout = () => {
    api.setToken(null);
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('jwt_user');
    setAuth(null);
  };

  const goToCandidates = (job) => {
    setJobForCandidates(job);
    setPage('candidates');
  };

  if (!auth) return <AuthPage onLogin={login} />;

  const navItems = [
    { id:'dashboard',  icon:'◈', label:'Dashboard' },
    { id:'jobs',       icon:'◉', label:'Jobs' },
    { id:'upload',     icon:'↑', label:'Upload Resumes' },
    { id:'candidates', icon:'◎', label:'Candidates' },
  ];

  const initials = (name) => name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);

  return (
    <div className="app-shell">
      <nav className="sidebar">
        <div className="sidebar-logo">Resume<span>AI</span></div>
        <div className="sidebar-nav">
          {navItems.map(n => (
            <div key={n.id} className={`nav-item ${page===n.id?'active':''}`}
                 onClick={() => setPage(n.id)}>
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </div>
          ))}
        </div>
        <div className="sidebar-user">
          <div className="user-avatar">{initials(auth.fullName||auth.email)}</div>
          <div className="user-info">
            <div className="user-name">{auth.fullName}</div>
            <div className="user-role">{auth.role}</div>
          </div>
          <span className="logout-btn" onClick={logout} title="Sign out">⏻</span>
        </div>
      </nav>

      <main className="main-content">
        <Suspense fallback={<div className="loader-container"><div className="loader"></div></div>}>
          <div key={page} className="page-reveal">
            {page === 'dashboard'  && <Dashboard />}
            {page === 'jobs'       && <Jobs onSelectJob={goToCandidates} />}
            {page === 'upload'     && <Upload />}
            {page === 'candidates' && <Candidates initialJob={jobForCandidates} />}
          </div>
        </Suspense>
      </main>
      <Toast />
    </div>
  );
}

export default App;
