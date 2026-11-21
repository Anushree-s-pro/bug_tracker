import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api.js';
import AuthLayout from '../components/AuthLayout.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // already signed in (e.g. pressed Back to /login) -> straight to the app
  if (user) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response ? errMsg(err) : 'Cannot reach the server. Is the backend running on port 8080?');
    } finally {
      setLoading(false);
    }
  };

  const demo = (email, password) => setForm({ email, password });

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue to your workspace.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" placeholder="you@company.com" value={form.email} required autoFocus
                 onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" className="input" placeholder="••••••••" value={form.password} required
                 onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <button className="btn-primary w-full !py-2.5" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        New here? <Link to="/register" className="font-medium text-indigo-600 hover:underline">Create an account</Link>
      </p>

      <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Demo accounts</div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary !py-1 !text-xs" onClick={() => demo('admin@bugtracker.com', 'Admin@123')}>Admin</button>
          <button type="button" className="btn-secondary !py-1 !text-xs" onClick={() => demo('manager@bugtracker.com', 'Manager@123')}>Manager</button>
          <button type="button" className="btn-secondary !py-1 !text-xs" onClick={() => demo('dev@bugtracker.com', 'Dev@1234')}>Developer</button>
        </div>
      </div>
    </AuthLayout>
  );
}
