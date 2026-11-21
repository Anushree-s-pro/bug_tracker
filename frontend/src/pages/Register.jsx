import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api.js';
import AuthLayout from '../components/AuthLayout.jsx';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'DEVELOPER' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response ? errMsg(err) : 'Cannot reach the server. Is the backend running on port 8080?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start tracking issues with your team in minutes.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <input className="input" value={form.name} onChange={set('name')} required maxLength={100} autoFocus />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" value={form.email} onChange={set('email')} required />
        </div>
        <div>
          <label className="label">Password (min 6 characters)</label>
          <input type="password" className="input" value={form.password} onChange={set('password')} required minLength={6} />
        </div>
        <div>
          <label className="label">I am a</label>
          <select className="input" value={form.role} onChange={set('role')}>
            <option value="DEVELOPER">Developer</option>
            <option value="MANAGER">Manager</option>
          </select>
        </div>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <button className="btn-primary w-full !py-2.5" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already registered? <Link to="/login" className="font-medium text-indigo-600 hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
