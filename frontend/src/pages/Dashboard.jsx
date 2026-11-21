import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Spinner from '../components/Spinner.jsx';
import Icon from '../components/Icons.jsx';
import ProjectFormModal from '../components/ProjectFormModal.jsx';
import { Avatar, PriorityBadge, TypeBadge } from '../components/Badges.jsx';

const Stat = ({ label, value, icon, tone }) => (
  <div className="card flex items-center gap-4 p-5">
    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}><Icon name={icon} /></span>
    <div>
      <div className="text-2xl font-bold leading-none text-slate-900">{value}</div>
      <div className="mt-1 text-xs font-medium text-slate-500">{label}</div>
    </div>
  </div>
);

const statusStyle = {
  TODO: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  DONE: 'bg-emerald-50 text-emerald-700',
};

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const load = () => {
    Promise.all([api.get('/dashboard'), api.get('/projects')])
      .then(([d, p]) => { setStats(d.data); setProjects(p.data); })
      .catch((e) => toast(e.response ? errMsg(e) : 'Cannot reach the server', 'error'));
  };
  useEffect(load, []); // eslint-disable-line

  if (!stats || !projects) return <Spinner />;
  const canCreate = user.role !== 'DEVELOPER';

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back, {user.name.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-slate-500">Here's an overview of your work across all projects.</p>
        </div>
        {canCreate && <button className="btn-primary" onClick={() => setShowNew(true)}><Icon name="plus" className="h-4 w-4" /> New project</button>}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Projects" value={stats.projects} icon="folder" tone="bg-indigo-50 text-indigo-600" />
        <Stat label="To do" value={stats.todo} icon="inbox" tone="bg-slate-100 text-slate-600" />
        <Stat label="In progress" value={stats.inProgress} icon="bolt" tone="bg-blue-50 text-blue-600" />
        <Stat label="Done" value={stats.done} icon="check" tone="bg-emerald-50 text-emerald-600" />
        <Stat label="Assigned to me" value={stats.assignedToMe} icon="user" tone="bg-amber-50 text-amber-600" />
      </div>

      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Projects</h2>
        {projects.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 p-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"><Icon name="folder" /></span>
            <p className="font-medium text-slate-700">No projects yet</p>
            <p className="text-sm text-slate-500">
              {canCreate ? 'Create your first project to start tracking issues.' : 'Ask a manager to add you to a project.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`}
                    className="card group block p-5 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 font-mono text-xs font-bold text-white">{p.projectKey.slice(0, 3)}</span>
                    <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700">{p.name}</h3>
                  </div>
                </div>
                <p className="mb-4 line-clamp-2 min-h-[2.5rem] text-sm text-slate-500">{p.description || 'No description'}</p>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <div className="flex -space-x-1.5">{p.members.slice(0, 5).map((m) => <Avatar key={m.id} user={m} />)}</div>
                  <span className="font-medium">{p.issueCount} issues</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Recent activity</h2>
        <div className="card divide-y divide-slate-100 overflow-hidden">
          {stats.recentIssues.length === 0 && <div className="p-6 text-center text-sm text-slate-400">Nothing yet.</div>}
          {stats.recentIssues.map((i) => (
            <Link key={i.id} to={`/projects/${i.projectId}`} className="flex items-center justify-between gap-4 px-5 py-3.5 transition hover:bg-slate-50">
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-20 shrink-0 font-mono text-xs text-slate-400">{i.issueKey}</span>
                <span className="truncate text-sm font-medium text-slate-800">{i.title}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden md:inline-flex"><TypeBadge type={i.type} /></span>
                <span className="hidden md:inline-flex"><PriorityBadge priority={i.priority} /></span>
                <span className={`hidden rounded-full px-2 py-0.5 text-[11px] font-semibold sm:inline ${statusStyle[i.status]}`}>
                  {i.status.replace('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                </span>
                <Avatar user={i.assignee} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {showNew && <ProjectFormModal onClose={() => setShowNew(false)} onSaved={() => { setShowNew(false); load(); }} />}
    </div>
  );
}
