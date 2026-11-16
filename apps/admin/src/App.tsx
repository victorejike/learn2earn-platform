import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Routes, Route, Navigate, NavLink, Outlet } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  LayoutDashboard, Users, GraduationCap, AlertTriangle,
  TrendingUp, Award, Zap, LogOut, Shield, BookOpen
} from 'lucide-react';

// ─── GraphQL ──────────────────────────────────────────────────

const ME_QUERY = gql`query Me { me { id fullName role status } }`;

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) { token user { id role } }
  }
`;

const DASHBOARD_QUERY = gql`
  query AdminDashboard {
    dashboardStats {
      totalStudents activeStudents atRiskStudents
      graduatedStudents activeCohorts
    }
  }
`;

const STUDENTS_QUERY = gql`
  query Students($status: UserStatus) {
    users(role: STUDENT, status: $status, limit: 50) {
      id fullName username email status xpTotal level auditRatio correctionPoints lastActiveAt
    }
  }
`;

// ─── Shared UI ────────────────────────────────────────────────

function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:               'bg-green-900/60 text-green-300 border border-green-800',
    at_risk:              'bg-orange-900/60 text-orange-300 border border-orange-800',
    inactive:             'bg-gray-800 text-gray-400 border border-gray-700',
    piscine:              'bg-blue-900/60 text-blue-300 border border-blue-800',
    graduated:            'bg-purple-900/60 text-purple-300 border border-purple-800',
    pending_verification: 'bg-yellow-900/60 text-yellow-300 border border-yellow-800',
    admission_test:       'bg-cyan-900/60 text-cyan-300 border border-cyan-800',
    rejected:             'bg-red-900/60 text-red-300 border border-red-800',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? 'bg-gray-800 text-gray-400'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function StatCard({
  icon: Icon, label, value, color, sub,
}: { icon: React.ElementType; label: string; value: number | string; color: string; sub?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-sm">{label}</span>
        <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [login, { loading }] = useMutation(LOGIN);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await login({ variables: { email, password } });
      const role = data.login.user.role;
      if (!['campus_staff', 'head_of_campus', 'admin'].includes(role)) {
        setError('Access denied. Staff accounts only.');
        return;
      }
      localStorage.setItem('talent_admin_token', data.login.token);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 mb-4">
            <Shield className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">1Talent</h1>
          <p className="text-gray-400 mt-1">Staff & Campus Admin Portal</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl border border-gray-800 p-8 space-y-5">
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg p-3 text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="staff@1talent.local" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-gray-600 text-xs mt-6">
          Dev: head@1talent.local / dev-password-123
        </p>
      </div>
    </div>
  );
}

// ─── Sidebar Layout ───────────────────────────────────────────

function AdminLayout() {
  const { data } = useQuery(ME_QUERY);
  const logout = () => { localStorage.removeItem('talent_admin_token'); window.location.href = '/login'; };
  const navItem = 'flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors text-sm';
  const active = 'bg-gray-800 text-white';

  return (
    <div className="flex h-screen bg-gray-950">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">1Talent</p>
              <p className="text-xs text-gray-500 capitalize">
                {data?.me?.role?.replace(/_/g, ' ') ?? 'Admin'}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          <NavLink to="/dashboard" className={({ isActive }) => `${navItem} ${isActive ? active : ''}`}>
            <LayoutDashboard className="w-5 h-5" /><span>Dashboard</span>
          </NavLink>
          <NavLink to="/students" className={({ isActive }) => `${navItem} ${isActive ? active : ''}`}>
            <Users className="w-5 h-5" /><span>Students</span>
          </NavLink>
          <NavLink to="/at-risk" className={({ isActive }) => `${navItem} ${isActive ? active : ''}`}>
            <AlertTriangle className="w-5 h-5" /><span>At-Risk Students</span>
          </NavLink>
          <NavLink to="/cohorts" className={({ isActive }) => `${navItem} ${isActive ? active : ''}`}>
            <GraduationCap className="w-5 h-5" /><span>Cohorts</span>
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => `${navItem} ${isActive ? active : ''}`}>
            <BookOpen className="w-5 h-5" /><span>Projects</span>
          </NavLink>
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <div className="px-4 py-2">
            <p className="text-white text-sm font-medium truncate">{data?.me?.fullName}</p>
            <p className="text-gray-500 text-xs capitalize">{data?.me?.role?.replace(/_/g, ' ')}</p>
          </div>
          <button onClick={logout}
            className={`${navItem} w-full text-red-400 hover:text-red-300 hover:bg-red-900/20`}>
            <LogOut className="w-5 h-5" /><span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────

function DashboardPage() {
  const { data, loading } = useQuery(DASHBOARD_QUERY);
  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;
  const s = data?.dashboardStats;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Campus Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Live overview of all students and campus activity</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard icon={Users}         label="Total Students"  value={s?.totalStudents ?? 0}   color="bg-indigo-600" />
        <StatCard icon={TrendingUp}    label="Active"          value={s?.activeStudents ?? 0}   color="bg-green-600"  sub="Last 72 h" />
        <StatCard icon={AlertTriangle} label="At Risk"         value={s?.atRiskStudents ?? 0}   color="bg-orange-600" sub="Needs follow-up" />
        <StatCard icon={Award}         label="Graduated"       value={s?.graduatedStudents ?? 0} color="bg-purple-600" />
        <StatCard icon={GraduationCap} label="Active Cohorts"  value={s?.activeCohorts ?? 0}    color="bg-blue-600" />
      </div>

      {(s?.atRiskStudents ?? 0) > 0 && (
        <div className="bg-orange-900/20 border border-orange-800 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <h2 className="font-semibold text-orange-300">
              {s?.atRiskStudents} student{s?.atRiskStudents !== 1 ? 's' : ''} need attention
            </h2>
          </div>
          <p className="text-orange-400 text-sm">
            These students have not been active for 72+ hours. Visit the At-Risk tab to send alerts.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Students Page ────────────────────────────────────────────

function StudentsPage() {
  const { data, loading } = useQuery(STUDENTS_QUERY, { variables: {} });
  if (loading) return <div className="p-8 text-gray-400">Loading students...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Students</h1>
        <span className="text-gray-400 text-sm">{data?.users?.length ?? 0} total</span>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              {['Name', 'Username', 'Status', 'Level', 'XP', 'Audit Ratio', 'Correction Pts'].map(h => (
                <th key={h} className="text-left text-gray-400 text-xs font-medium px-5 py-3 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.users?.map((u: {
              id: string; fullName: string; username: string; status: string;
              level: number; xpTotal: number; auditRatio: number; correctionPoints: number;
            }) => (
              <tr key={u.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors">
                <td className="px-5 py-3 text-white font-medium">{u.fullName}</td>
                <td className="px-5 py-3 text-gray-400 text-sm">@{u.username}</td>
                <td className="px-5 py-3"><Badge status={u.status} /></td>
                <td className="px-5 py-3 text-white">{u.level}</td>
                <td className="px-5 py-3 text-indigo-400 font-medium">{u.xpTotal.toLocaleString()}</td>
                <td className="px-5 py-3">
                  <span className={u.auditRatio < 0.9 ? 'text-orange-400' : 'text-gray-300'}>
                    {u.auditRatio.toFixed(2)}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-300">{u.correctionPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── At-Risk Page ─────────────────────────────────────────────

function AtRiskPage() {
  const { data, loading } = useQuery(STUDENTS_QUERY, { variables: { status: 'AT_RISK' } });
  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;
  const students = data?.users ?? [];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">At-Risk Students</h1>
      <p className="text-gray-400 text-sm mb-6">Students inactive for 72+ hours. Send an alert to re-engage them.</p>

      {students.length === 0 ? (
        <div className="bg-green-900/20 border border-green-800 rounded-xl p-8 text-center">
          <Award className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="text-green-300 font-medium">No at-risk students right now.</p>
          <p className="text-green-500 text-sm mt-1">All students have been active in the last 72 hours.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((u: { id: string; fullName: string; username: string; xpTotal: number; level: number }) => (
            <div key={u.id} className="bg-gray-900 border border-orange-800/50 rounded-xl p-5 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{u.fullName}</p>
                <p className="text-gray-400 text-sm">@{u.username} · Level {u.level} · {u.xpTotal} XP</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge status="at_risk" />
                <button className="text-sm bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors">
                  Send Alert
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Placeholder Pages ────────────────────────────────────────

function PlaceholderPage({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">{title}</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
        <Icon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Coming in next sprint</p>
      </div>
    </div>
  );
}

// ─── Auth Guard ───────────────────────────────────────────────

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data, loading } = useQuery(ME_QUERY);
  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-950">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
    </div>
  );
  if (!data?.me) return <Navigate to="/login" replace />;
  const allowed = ['campus_staff', 'head_of_campus', 'admin'];
  if (!allowed.includes(data.me.role)) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// ─── App Root ─────────────────────────────────────────────────

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="students"  element={<StudentsPage />} />
        <Route path="at-risk"   element={<AtRiskPage />} />
        <Route path="cohorts"   element={<PlaceholderPage title="Cohorts & Piscine" icon={GraduationCap} />} />
        <Route path="projects"  element={<PlaceholderPage title="Projects" icon={BookOpen} />} />
      </Route>
    </Routes>
  );
}
