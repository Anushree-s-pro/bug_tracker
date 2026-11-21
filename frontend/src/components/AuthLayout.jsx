export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-700 p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5 text-xl font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500">🐛</span> BugTracker
        </div>
        <div>
          <h2 className="max-w-md text-4xl font-bold leading-tight">Ship better software, one ticket at a time.</h2>
          <ul className="mt-8 space-y-3 text-indigo-100">
            {['Kanban boards with drag & drop', 'Assign, comment and attach screenshots', 'Role-based access for teams', 'Powerful filters and search'].map((t) => (
              <li key={t} className="flex items-center gap-3"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-xs">✓</span>{t}</li>
            ))}
          </ul>
        </div>
        <div className="text-sm text-indigo-200/80">© {new Date().getFullYear()} BugTracker</div>
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      <div className="flex items-center justify-center bg-white p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 text-lg font-semibold text-slate-900 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-base">🐛</span> BugTracker
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mb-8 mt-1 text-sm text-slate-500">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
