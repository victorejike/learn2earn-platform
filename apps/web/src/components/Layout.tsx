import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderCode, User, LogOut, Zap } from 'lucide-react';

export default function Layout() {
  const logout = () => { localStorage.removeItem('talent_token'); window.location.href = '/login'; };
  const navItem = 'flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors';
  const active = 'bg-gray-800 text-white';
  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">1Talent</p>
              <p className="text-xs text-gray-500">Student Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLink to="/dashboard" className={({ isActive }) => `${navItem} ${isActive ? active : ''}`}>
            <LayoutDashboard className="w-5 h-5" /><span>Dashboard</span>
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => `${navItem} ${isActive ? active : ''}`}>
            <FolderCode className="w-5 h-5" /><span>Projects</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `${navItem} ${isActive ? active : ''}`}>
            <User className="w-5 h-5" /><span>Profile</span>
          </NavLink>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={logout} className={`${navItem} w-full text-red-400 hover:text-red-300 hover:bg-red-900/20`}>
            <LogOut className="w-5 h-5" /><span>Logout</span>
          </button>
        </div>
      </aside>
      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
