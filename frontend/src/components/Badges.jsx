const PRIORITY = {
  LOW: 'bg-slate-100 text-slate-600 ring-slate-200',
  MEDIUM: 'bg-amber-50 text-amber-700 ring-amber-200',
  HIGH: 'bg-orange-50 text-orange-700 ring-orange-200',
  CRITICAL: 'bg-red-50 text-red-700 ring-red-200',
};
const TYPE = {
  BUG: { dot: 'bg-red-500', cls: 'bg-red-50 text-red-700 ring-red-200' },
  TASK: { dot: 'bg-blue-500', cls: 'bg-blue-50 text-blue-700 ring-blue-200' },
  STORY: { dot: 'bg-emerald-500', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
};
const ROLE = {
  ADMIN: 'bg-purple-50 text-purple-700 ring-purple-200',
  MANAGER: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  DEVELOPER: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};
const base = 'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset';
const cap = (s) => s.charAt(0) + s.slice(1).toLowerCase();

export const PriorityBadge = ({ priority }) => <span className={`${base} ${PRIORITY[priority]}`}>{cap(priority)}</span>;
export const TypeBadge = ({ type }) => (
  <span className={`${base} ${TYPE[type].cls}`}><span className={`h-1.5 w-1.5 rounded-full ${TYPE[type].dot}`} />{cap(type)}</span>
);
export const RoleBadge = ({ role }) => <span className={`${base} ${ROLE[role]}`}>{cap(role)}</span>;

const COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-sky-500', 'bg-fuchsia-500', 'bg-teal-500'];
const colorFor = (name) => COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];

export const Avatar = ({ user, size = 'h-6 w-6 text-[10px]' }) =>
  user ? (
    <span title={user.name}
          className={`inline-flex ${size} shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-white ${colorFor(user.name)}`}>
      {user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
    </span>
  ) : (
    <span title="Unassigned"
          className={`inline-flex ${size} shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white text-slate-400`}>?</span>
  );
