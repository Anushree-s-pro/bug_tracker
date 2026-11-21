import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Spinner from '../components/Spinner.jsx';
import { Avatar } from '../components/Badges.jsx';

/** Admin-only page: manage roles of all users. */
export default function Users() {
  const { user } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState(null);

  useEffect(() => {
    api.get('/users').then((r) => setUsers(r.data)).catch((e) => toast(errMsg(e), 'error'));
  }, []); // eslint-disable-line

  if (user.role !== 'ADMIN') return <Navigate to="/" replace />;
  if (!users) return <Spinner />;

  const changeRole = async (u, role) => {
    try {
      const res = await api.put(`/users/${u.id}/role`, { role });
      setUsers(users.map((x) => (x.id === u.id ? res.data : x)));
      toast(`${u.name} is now ${role}`);
    } catch (e) { toast(errMsg(e), 'error'); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">User management</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">Change the role of any team member. You cannot change your own role.</p>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr><th className="p-3">User</th><th className="p-3">Email</th><th className="p-3">Role</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="p-3"><span className="flex items-center gap-2"><Avatar user={u} size="h-8 w-8 text-xs" />{u.name}</span></td>
                <td className="p-3 text-slate-500">{u.email}</td>
                <td className="p-3">
                  <select className="input !w-40" value={u.role} disabled={u.id === user.id}
                          onChange={(e) => changeRole(u, e.target.value)}>
                    <option>ADMIN</option><option>MANAGER</option><option>DEVELOPER</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
