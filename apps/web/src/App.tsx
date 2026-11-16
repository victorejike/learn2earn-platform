import { Routes, Route, Navigate } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import LoginPage from './features/auth/LoginPage.tsx';
import Dashboard from './features/dashboard/Dashboard.tsx';
import ProjectsPage from './features/projects/ProjectsPage.tsx';
import ProfilePage from './features/profile/ProfilePage.tsx';
import Layout from './components/Layout.tsx';

const ME_QUERY = gql`query Me { me { id username fullName role status xpTotal level correctionPoints auditRatio } }`;

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data, loading } = useQuery(ME_QUERY);
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500" /></div>;
  if (!data?.me) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}
