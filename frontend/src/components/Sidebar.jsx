import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Icon from './Icons.jsx';
import { Avatar } from './Badges.jsx';

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState([]);

  const load = () => api.get('/projects').then((r) => setProjects(r.data)).catch(() => {});
  useEffect(() => { load(); }, [location.pathname]); // eslint-disable-line
  useEffect(() => {
    window.addEventListener('projects:changed', load);
    return () => window.removeEventListener('projects:changed', load);
  }, []);
  useEffect(() => { onClose(); }, [location.pathname]); // eslint-disable-line

  const item = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-indigo-500/20 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`;

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 transition-transform duration-200 lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-14 items-center gap-2.5 border-b border-white/10 px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-base">🐛</span>
          <span className="text-lg font-semibold tracking-tight text-white">BugTracker</span>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          <div className="space-y-1">
            <NavLink to="/" end className={item}><Icon name="home" /> Dashboard</NavLink>
            {user.role === 'ADMIN' && <NavLink to="/users" className={item}><Icon name="users" /> Users</NavLink>}
          </div>

          <div>
            <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Projects</div>
            <div className="space-y-1">
              {projects.length === 0 && <div className="px-3 text-sm text-slate-500">No projects yet</div>}
              {projects.map((p) => (
                <NavLink key={p.id} to={`/projects/${p.id}`} className={item}>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-700 font-mono text-[10px] font-bold text-slate-200">
                    {p.projectKey.slice(0, 3)}
                  </span>
                  <span className="truncate">{p.name}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-lg p-2">
            <Avatar user={user} size="h-9 w-9 text-xs" />
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-medium text-white">{user.name}</div>
              <div className="truncate text-xs capitalize text-slate-400">{user.role.toLowerCase()}</div>
            </div>
            <button title="Sign out" className="rounded-md p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                    onClick={() => { logout(); navigate('/login', { replace: true }); }}>
              <Icon name="logout" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
