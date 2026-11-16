import { useQuery, gql } from '@apollo/client';
import { User, Mail, Zap, TrendingUp, Shield, Award } from 'lucide-react';

const ME_QUERY = gql`query Me { me { id username email fullName role status xpTotal level auditRatio correctionPoints createdAt } }`;

export default function ProfilePage() {
  const { data, loading } = useQuery(ME_QUERY);
  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;
  const me = data?.me;
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">My Profile</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-6">
        {/* Avatar row */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center text-white text-2xl font-bold">
            {me?.fullName?.[0] ?? '?'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{me?.fullName}</h2>
            <p className="text-gray-400">@{me?.username}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Zap, label: 'Total XP', value: me?.xpTotal },
            { icon: TrendingUp, label: 'Level', value: me?.level },
            { icon: Award, label: 'Correction Points', value: me?.correctionPoints },
            { icon: Shield, label: 'Audit Ratio', value: (me?.auditRatio ?? 0).toFixed(2) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-brand-400" />
                <span className="text-xs text-gray-400">{label}</span>
              </div>
              <p className="text-xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-2 border-t border-gray-800">
          <div className="flex items-center gap-3 text-gray-300">
            <Mail className="w-4 h-4 text-gray-500" />
            <span>{me?.email}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-300">
            <User className="w-4 h-4 text-gray-500" />
            <span>Role: <span className="text-brand-400 capitalize">{me?.role?.replace(/_/g, ' ')}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
