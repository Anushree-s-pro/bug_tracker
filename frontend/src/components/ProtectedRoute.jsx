import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from './Sidebar.jsx';
import Spinner from './Spinner.jsx';
import Icon from './Icons.jsx';
import { RoleBadge } from './Badges.jsx';

export default function ProtectedRoute() {
  const { user, checking } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  if (checking) return <div className="min-h-screen"><Spinner label="Restoring your session..." /></div>;
  // remember where the user was heading so login can send them back there
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return (
    <div className="min-h-screen lg:pl-64">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur lg:px-8">
        <button className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
          <Icon name="menu" />
        </button>
        <div className="hidden text-sm text-slate-500 lg:block">Issue tracking made simple</div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-slate-600 sm:inline">{user.email}</span>
          <RoleBadge role={user.role} />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8"><Outlet /></main>
    </div>
  );
}
