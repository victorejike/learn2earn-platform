import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import LoginPage from './features/auth/LoginPage';
import Dashboard from './features/dashboard/Dashboard';
import ProjectsPage from './features/projects/ProjectsPage';
import ProfilePage from './features/profile/ProfilePage';
import LandingPage from './features/admission/LandingPage';
import ApplicationPage from './features/admission/ApplicationPage';
import ApplicationStatusPage from './features/admission/ApplicationStatusPage';
import AdmissionTestPage from './features/admission/AdmissionTestPage';
import IntraProfilePage from './features/admission/IntraProfilePage';
import Layout from './components/Layout';

const ME_QUERY = gql`query Me { me { id username fullName role status xpTotal level correctionPoints auditRatio } }`;

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data, loading } = useQuery(ME_QUERY);
  if (loading) return <div className="flex h-screen items-center justify-center bg-[#030712]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" /></div>;
  if (!data?.me) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* 01Edu-style entry portal as primary landing and login */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Full Marketing / Overview narrative */}
      <Route path="/overview" element={<LandingPage />} />

      {/* Admission and Assessment Flow */}
      <Route path="/apply" element={<ApplicationPage />} />
      <Route path="/intra/:campusSlug" element={<ProtectedRoute><IntraProfilePage /></ProtectedRoute>} />
      <Route path="/intra" element={<Navigate to="/intra/learn2earn" replace />} />
      <Route path="/application" element={<ProtectedRoute><IntraProfilePage /></ProtectedRoute>} />
      <Route path="/application/status" element={<ProtectedRoute><ApplicationStatusPage /></ProtectedRoute>} />
      <Route path="/assessment" element={<ProtectedRoute><AdmissionTestPage /></ProtectedRoute>} />

      {/* Authenticated Student Portal */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
