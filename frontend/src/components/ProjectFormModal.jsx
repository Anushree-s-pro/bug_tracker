import { useState } from 'react';
import api, { errMsg } from '../api.js';
import Modal from './Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';

/** Create (project == null) or edit a project. */
export default function ProjectFormModal({ project, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: project?.name || '',
    projectKey: project?.projectKey || '',
    description: project?.description || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = project ? await api.put(`/projects/${project.id}`, form) : await api.post('/projects', form);
      toast(project ? 'Project updated' : 'Project created');
      window.dispatchEvent(new Event('projects:changed'));
      onSaved(res.data);
    } catch (err) {
      toast(errMsg(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={project ? 'Edit project' : 'New project'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="label">Name</label>
          <input className="input" value={form.name} onChange={set('name')} required maxLength={100} autoFocus />
        </div>
        <div>
          <label className="label">Key (2-10 letters, e.g. WEB)</label>
          <input className="input uppercase" value={form.projectKey}
                 onChange={(e) => setForm({ ...form, projectKey: e.target.value.replace(/[^a-zA-Z]/g, '') })}
                 required minLength={2} maxLength={10} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={3} value={form.description} onChange={set('description')} maxLength={1000} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}
