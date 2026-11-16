import { useQuery, gql } from '@apollo/client';
import { FolderCode } from 'lucide-react';

const PROJECTS_QUERY = gql`query Projects { projects { id slug title description xpReward tags } }`;

export default function ProjectsPage() {
  const { data, loading } = useQuery(PROJECTS_QUERY);
  if (loading) return <div className="p-8 text-gray-400">Loading projects...</div>;
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Projects</h1>
      <div className="space-y-3">
        {data?.projects?.map((p: { id: string; slug: string; title: string; description: string; xpReward: number; tags: string[] }) => (
          <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-start gap-4 hover:border-gray-700 transition-colors">
            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <FolderCode className="w-5 h-5 text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-white">{p.title}</h3>
                <span className="text-brand-400 text-sm font-medium ml-4">+{p.xpReward} XP</span>
              </div>
              <p className="text-gray-400 text-sm truncate">{p.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
