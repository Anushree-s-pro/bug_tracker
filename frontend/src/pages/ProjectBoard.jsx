import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg, PRIORITIES, STATUSES, TYPES } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Spinner from '../components/Spinner.jsx';
import KanbanBoard from '../components/KanbanBoard.jsx';
import IssueModal from '../components/IssueModal.jsx';
import MembersModal from '../components/MembersModal.jsx';
import ProjectFormModal from '../components/ProjectFormModal.jsx';
import Icon from '../components/Icons.jsx';
import { Avatar, PriorityBadge, TypeBadge } from '../components/Badges.jsx';

const emptyFilters = { q: '', status: '', priority: '', type: '', assignee: '' };

export default function ProjectBoard() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [issues, setIssues] = useState(null);
  const [filters, setFilters] = useState(emptyFilters);
  const [search, setSearch] = useState('');           // raw input, debounced into filters.q
  const [view, setView] = useState('board');          // 'board' | 'list'
  const [modal, setModal] = useState(null);           // null | 'new' | issue | 'members' | 'edit-project'

  const canManage = project && (user.role === 'ADMIN' || project.owner.id === user.id);

  useEffect(() => {
    api.get(`/projects/${id}`).then((r) => setProject(r.data))
      .catch((e) => { toast(e.response ? errMsg(e) : 'Cannot reach the server', 'error'); navigate('/', { replace: true }); });
  }, [id]); // eslint-disable-line

  // debounce the search box
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, q: search })), 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadIssues = useCallback(() => {
    const params = {};
    if (filters.q) params.q = filters.q;
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.type) params.type = filters.type;
    if (filters.assignee === 'none') params.unassigned = true;
    else if (filters.assignee) params.assigneeId = filters.assignee;
    api.get(`/projects/${id}/issues`, { params })
      .then((r) => setIssues(r.data))
      .catch((e) => toast(errMsg(e), 'error'));
  }, [id, filters]); // eslint-disable-line

  useEffect(loadIssues, [loadIssues]);

  // optimistic Kanban move
  const moveIssue = async (issue, status) => {
    const prev = issues;
    setIssues(issues.map((i) => (i.id === issue.id ? { ...i, status } : i)));
    try {
      await api.patch(`/issues/${issue.id}/status`, { status });
    } catch (e) {
      setIssues(prev);
      toast(errMsg(e), 'error');
    }
  };

  const deleteProject = async () => {
    if (!window.confirm(`Delete project "${project.name}" with all its issues and comments?`)) return;
    try {
      await api.delete(`/projects/${id}`);
      toast('Project deleted');
      window.dispatchEvent(new Event('projects:changed'));
      navigate('/', { replace: true });
    } catch (e) { toast(errMsg(e), 'error'); }
  };

  const hasFilters = Object.values(filters).some(Boolean);
  const setF = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  if (!project) return <Spinner />;

  return (
    <div className="space-y-5">
      {/* header */}
      <div>
        <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-indigo-600">
          <Icon name="back" className="h-4 w-4" /> Back to dashboard
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 font-mono text-sm font-bold text-white">{project.projectKey.slice(0, 3)}</span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{project.name}</h1>
              <p className="mt-0.5 max-w-2xl text-sm text-slate-500">{project.description || 'No description'}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-secondary" onClick={() => setModal('members')}>
              <span className="flex -space-x-1.5">{project.members.slice(0, 4).map((m) => <Avatar key={m.id} user={m} />)}</span>
              Team ({project.members.length})
            </button>
            {canManage && <button className="btn-secondary" onClick={() => setModal('edit-project')}>Edit</button>}
            {canManage && <button className="btn-secondary !text-red-600 hover:!bg-red-50" onClick={deleteProject}>Delete</button>}
            <button className="btn-primary" onClick={() => setModal('new')}><Icon name="plus" className="h-4 w-4" /> New issue</button>
          </div>
        </div>
      </div>

      {/* filters */}
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <input className="input !w-60" placeholder="Search issues..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input !w-auto" value={filters.status} onChange={setF('status')}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select className="input !w-auto" value={filters.priority} onChange={setF('priority')}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select className="input !w-auto" value={filters.type} onChange={setF('type')}>
          <option value="">All types</option>
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className="input !w-auto" value={filters.assignee} onChange={setF('assignee')}>
          <option value="">Any assignee</option>
          <option value="none">Unassigned</option>
          {project.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        {hasFilters && (
          <button className="text-sm text-indigo-600 hover:underline" onClick={() => { setFilters(emptyFilters); setSearch(''); }}>
            Clear filters
          </button>
        )}
        <div className="ml-auto flex overflow-hidden rounded-lg border border-slate-300 text-sm shadow-sm">
          {['board', 'list'].map((v) => (
            <button key={v} onClick={() => setView(v)}
                    className={`flex items-center gap-1.5 px-3 py-2 capitalize ${view === v ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
              <Icon name={v} className="h-4 w-4" />{v}
            </button>
          ))}
        </div>
      </div>

      {/* content */}
      {!issues ? <Spinner label="Loading issues..." /> : view === 'board' ? (
        <KanbanBoard issues={issues} onOpen={setModal} onMove={moveIssue} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">Key</th><th className="p-3">Title</th><th className="p-3">Type</th>
                <th className="p-3">Priority</th><th className="p-3">Status</th><th className="p-3">Assignee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {issues.map((i) => (
                <tr key={i.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setModal(i)}>
                  <td className="p-3 font-mono text-xs">{i.issueKey}</td>
                  <td className="p-3 font-medium">{i.title}</td>
                  <td className="p-3"><TypeBadge type={i.type} /></td>
                  <td className="p-3"><PriorityBadge priority={i.priority} /></td>
                  <td className="p-3">{STATUSES.find((s) => s.key === i.status).label}</td>
                  <td className="p-3"><span className="flex items-center gap-2"><Avatar user={i.assignee} />{i.assignee?.name || '—'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {issues && issues.length === 0 && (
        <div className="py-6 text-center text-slate-400">{hasFilters ? 'No issues match your filters.' : 'No issues yet - create the first one!'}</div>
      )}

      {/* modals */}
      {modal && typeof modal === 'object' && modal.id !== undefined && (
        <IssueModal project={project} issue={modal} onClose={() => setModal(null)}
                    onSaved={(updated, keepOpen) => { if (!keepOpen) setModal(null); loadIssues(); }}
                    onDeleted={() => { setModal(null); loadIssues(); }} />
      )}
      {modal === 'new' && (
        <IssueModal project={project} issue={null} onClose={() => setModal(null)}
                    onSaved={() => { setModal(null); loadIssues(); }} />
      )}
      {modal === 'members' && (
        <MembersModal project={project} canManage={canManage} onClose={() => setModal(null)}
                      onChanged={(p) => { setProject(p); loadIssues(); }} />
      )}
      {modal === 'edit-project' && (
        <ProjectFormModal project={project} onClose={() => setModal(null)}
                          onSaved={(p) => { setProject(p); setModal(null); loadIssues(); }} />
      )}
    </div>
  );
}
