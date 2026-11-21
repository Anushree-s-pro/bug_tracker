import { useEffect, useRef, useState } from 'react';
import api, { errMsg, fileUrl, PRIORITIES, STATUSES, TYPES } from '../api.js';
import Modal from './Modal.jsx';
import { Avatar } from './Badges.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

/**
 * Create (issue == null) or view/edit an issue, including screenshot upload and comments.
 */
export default function IssueModal({ project, issue: initial, onClose, onSaved, onDeleted }) {
  const { user } = useAuth();
  const toast = useToast();
  const isNew = !initial;

  const [issue, setIssue] = useState(initial);
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    type: initial?.type || 'BUG',
    priority: initial?.priority || 'MEDIUM',
    status: initial?.status || 'TODO',
    assigneeId: initial?.assignee?.id || '',
  });
  const [file, setFile] = useState(null);           // screenshot chosen while creating
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const fileInput = useRef(null);

  const isAdmin = user.role === 'ADMIN';
  const canManage = isAdmin || project.owner.id === user.id;
  const canEdit = isNew || canManage || issue.reporter.id === user.id || issue.assignee?.id === user.id;
  const canDelete = !isNew && (canManage || issue.reporter.id === user.id);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    if (!isNew) api.get(`/issues/${initial.id}/comments`).then((r) => setComments(r.data)).catch(() => {});
  }, [initial, isNew]);

  const payload = () => ({ ...form, assigneeId: form.assigneeId ? Number(form.assigneeId) : null });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let res;
      if (isNew) {
        res = await api.post(`/projects/${project.id}/issues`, payload());
        if (file) {
          const fd = new FormData();
          fd.append('file', file);
          res = await api.post(`/issues/${res.data.id}/screenshot`, fd);
        }
        toast('Issue created');
      } else {
        res = await api.put(`/issues/${issue.id}`, payload());
        toast('Issue updated');
      }
      onSaved(res.data);
    } catch (err) {
      toast(errMsg(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete ${issue.issueKey}? This cannot be undone.`)) return;
    try {
      await api.delete(`/issues/${issue.id}`);
      toast('Issue deleted');
      onDeleted(issue.id);
    } catch (err) { toast(errMsg(err), 'error'); }
  };

  const uploadScreenshot = async (f) => {
    if (!f) return;
    if (isNew) { setFile(f); return; }
    try {
      const fd = new FormData();
      fd.append('file', f);
      const res = await api.post(`/issues/${issue.id}/screenshot`, fd);
      setIssue(res.data);
      onSaved(res.data, true);
      toast('Screenshot uploaded');
    } catch (err) { toast(errMsg(err), 'error'); }
  };

  const removeScreenshot = async () => {
    if (isNew) { setFile(null); return; }
    try {
      const res = await api.delete(`/issues/${issue.id}/screenshot`);
      setIssue(res.data);
      onSaved(res.data, true);
    } catch (err) { toast(errMsg(err), 'error'); }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await api.post(`/issues/${issue.id}/comments`, { content: newComment });
      setComments([...comments, res.data]);
      setNewComment('');
    } catch (err) { toast(errMsg(err), 'error'); }
  };

  const deleteComment = async (id) => {
    try {
      await api.delete(`/comments/${id}`);
      setComments(comments.filter((c) => c.id !== id));
    } catch (err) { toast(errMsg(err), 'error'); }
  };

  const screenshot = file ? URL.createObjectURL(file) : fileUrl(issue?.screenshotUrl);
  const ro = !canEdit;

  return (
    <Modal wide title={isNew ? `New issue in ${project.name}` : `${issue.issueKey}`} onClose={onClose}>
      <div className="grid gap-6 md:grid-cols-3">
        {/* ---- left: form ---- */}
        <form onSubmit={save} className="space-y-3 md:col-span-2">
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={set('title')} required maxLength={200} disabled={ro} autoFocus />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={5} value={form.description} onChange={set('description')} maxLength={4000} disabled={ro} />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={set('type')} disabled={ro}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={set('priority')} disabled={ro}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={set('status')} disabled={ro}>
                {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Assignee</label>
              <select className="input" value={form.assigneeId} onChange={set('assigneeId')} disabled={ro}>
                <option value="">Unassigned</option>
                {project.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          {/* screenshot */}
          <div>
            <label className="label">Screenshot (optional, max 5MB)</label>
            {screenshot && (
              <div className="relative mb-2 inline-block">
                <a href={screenshot} target="_blank" rel="noreferrer">
                  <img src={screenshot} alt="screenshot" className="max-h-48 rounded border border-slate-200" />
                </a>
                {canEdit && (
                  <button type="button" onClick={removeScreenshot}
                          className="absolute right-1 top-1 rounded bg-black/60 px-1.5 text-xs text-white">remove</button>
                )}
              </div>
            )}
            {canEdit && (
              <div>
                <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden"
                       onChange={(e) => { uploadScreenshot(e.target.files[0]); e.target.value = ''; }} />
                <button type="button" className="btn-secondary" onClick={() => fileInput.current.click()}>
                  📎 {screenshot ? 'Replace image' : 'Attach image'}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {canDelete && <button type="button" className="btn-danger" onClick={remove}>Delete</button>}
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
              {canEdit && <button className="btn-primary" disabled={saving}>{saving ? 'Saving...' : isNew ? 'Create issue' : 'Save changes'}</button>}
            </div>
          </div>
          {ro && <p className="text-xs text-slate-500">You can view this issue and comment on it, but only the reporter, assignee or project manager can edit it.</p>}
        </form>

        {/* ---- right: meta + comments ---- */}
        {!isNew && (
          <aside className="space-y-4">
            <div className="rounded-md bg-slate-50 p-3 text-sm">
              <div className="mb-2 flex items-center gap-2"><span className="text-slate-500">Reporter</span><Avatar user={issue.reporter} /> {issue.reporter.name}</div>
              <div className="mb-2 flex items-center gap-2"><span className="text-slate-500">Assignee</span><Avatar user={issue.assignee} /> {issue.assignee?.name || 'Unassigned'}</div>
              <div className="text-xs text-slate-500">Created {new Date(issue.createdAt).toLocaleString()}</div>
              <div className="text-xs text-slate-500">Updated {new Date(issue.updatedAt).toLocaleString()}</div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">Comments ({comments.length})</h3>
              <ul className="mb-3 max-h-64 space-y-3 overflow-y-auto">
                {comments.map((c) => (
                  <li key={c.id} className="rounded-md bg-slate-50 p-2 text-sm">
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{c.author.name}</span>
                      <span>
                        {new Date(c.createdAt).toLocaleString()}
                        {(c.author.id === user.id || canManage) && (
                          <button className="ml-2 text-red-500 hover:underline" onClick={() => deleteComment(c.id)}>delete</button>
                        )}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{c.content}</p>
                  </li>
                ))}
                {comments.length === 0 && <li className="text-sm text-slate-400">No comments yet.</li>}
              </ul>
              <form onSubmit={addComment} className="space-y-2">
                <textarea className="input" rows={2} placeholder="Write a comment..." value={newComment}
                          onChange={(e) => setNewComment(e.target.value)} maxLength={2000} />
                <button className="btn-primary w-full" disabled={!newComment.trim()}>Comment</button>
              </form>
            </div>
          </aside>
        )}
      </div>
    </Modal>
  );
}
