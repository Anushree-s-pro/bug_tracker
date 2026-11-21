import { useEffect, useState } from 'react';
import api, { errMsg } from '../api.js';
import Modal from './Modal.jsx';
import { Avatar, RoleBadge } from './Badges.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function MembersModal({ project, canManage, onClose, onChanged }) {
  const toast = useToast();
  const [allUsers, setAllUsers] = useState([]);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    if (canManage) api.get('/users').then((r) => setAllUsers(r.data)).catch(() => {});
  }, [canManage]);

  const memberIds = new Set(project.members.map((m) => m.id));
  const candidates = allUsers.filter((u) => !memberIds.has(u.id));

  const add = async () => {
    if (!selected) return;
    try {
      const res = await api.post(`/projects/${project.id}/members/${selected}`);
      setSelected('');
      toast('Member added');
      onChanged(res.data);
    } catch (e) { toast(errMsg(e), 'error'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this member? Their issues in this project will become unassigned.')) return;
    try {
      const res = await api.delete(`/projects/${project.id}/members/${id}`);
      toast('Member removed');
      onChanged(res.data);
    } catch (e) { toast(errMsg(e), 'error'); }
  };

  return (
    <Modal title={`Team - ${project.name}`} onClose={onClose}>
      <ul className="divide-y divide-slate-100">
        {project.members.map((m) => (
          <li key={m.id} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Avatar user={m} size="h-8 w-8 text-xs" />
              <div>
                <div className="text-sm font-medium">
                  {m.name} {m.id === project.owner.id && <span className="text-xs text-slate-400">(owner)</span>}
                </div>
                <div className="text-xs text-slate-500">{m.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RoleBadge role={m.role} />
              {canManage && m.id !== project.owner.id && (
                <button className="text-xs text-red-600 hover:underline" onClick={() => remove(m.id)}>Remove</button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {canManage && (
        <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
          <select className="input" value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">Add a team member...</option>
            {candidates.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </select>
          <button className="btn-primary" onClick={add} disabled={!selected}>Add</button>
        </div>
      )}
    </Modal>
  );
}
