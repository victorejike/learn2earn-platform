import { useQuery, gql } from '@apollo/client';
import { TrendingUp, Users, AlertTriangle, Award, Zap } from 'lucide-react';

const DASHBOARD_QUERY = gql`
  query Dashboard {
    me { id fullName username xpTotal level auditRatio correctionPoints status }
    dashboardStats { totalStudents activeStudents atRiskStudents graduatedStudents activeCohorts }
    projects(limit: 4) { id slug title xpReward tags }
  }
`;

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-sm">{label}</span>
        <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { data, loading } = useQuery(DASHBOARD_QUERY);
  if (loading) return <div className="p-8 text-gray-400">Loading dashboard...</div>;
  const me = data?.me;
  const stats = data?.dashboardStats;
  const isStaff = ['campus_staff', 'head_of_campus', 'admin'].includes(me?.role ?? '');

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome back, {me?.fullName?.split(' ')[0]} 👋</h1>
        <p className="text-gray-400">Level {me?.level} · {me?.xpTotal} XP · {me?.correctionPoints} correction points</p>
      </div>

      {/* Personal Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={Zap} label="Total XP" value={me?.xpTotal ?? 0} color="bg-brand-600" />
        <StatCard icon={TrendingUp} label="Audit Ratio" value={(me?.auditRatio ?? 0).toFixed(2)} color="bg-blue-600" />
      </div>

      {/* Campus Stats — staff only */}
      {isStaff && stats && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Campus Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Students" value={stats.totalStudents} color="bg-indigo-600" />
            <StatCard icon={TrendingUp} label="Active" value={stats.activeStudents} color="bg-brand-600" />
            <StatCard icon={AlertTriangle} label="At Risk" value={stats.atRiskStudents} color="bg-orange-600" />
            <StatCard icon={Award} label="Graduated" value={stats.graduatedStudents} color="bg-purple-600" />
          </div>
        </div>
      )}

      {/* Recent Projects */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Available Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.projects?.map((p: { id: string; slug: string; title: string; xpReward: number; tags: string[] }) => (
            <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-brand-700 transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-white">{p.title}</h3>
                <span className="text-brand-400 text-sm font-medium">+{p.xpReward} XP</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {p.tags.map((tag: string) => (
                  <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-md">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
