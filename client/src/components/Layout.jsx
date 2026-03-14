import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, LogOut, Menu, X } from 'lucide-react';

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-2 rounded px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
  }`;

export default function Layout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  const SidebarContent = () => (
    <>
      <div className="border-b border-gray-200 px-4 py-4">
        <h1 className="text-lg font-bold text-gray-900">ენერგო პრო</h1>
        <p className="text-xs text-gray-500">ადმინ პანელი</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        <NavLink to="/" end className={navLinkClass} onClick={closeSidebar}>
          <LayoutDashboard size={18} />
          მთავარი
        </NavLink>
        <NavLink to="/employees" className={navLinkClass} onClick={closeSidebar}>
          <Users size={18} />
          თანამშრომლები
        </NavLink>
      </nav>

      <div className="border-t border-gray-200 px-3 py-3 space-y-2">
        <span className="truncate text-xs text-gray-500">{user?.email}</span>
        <button
          onClick={() => { closeSidebar(); logout(); }}
          className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          <LogOut size={16} />
          გასვლა
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute right-2 top-3">
          <button onClick={closeSidebar} className="rounded p-1 text-gray-500 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden w-56 flex-col border-r border-gray-200 bg-white md:flex">
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 md:hidden">
          <button onClick={() => setSidebarOpen(true)} className="rounded p-1 text-gray-600 hover:bg-gray-100">
            <Menu size={22} />
          </button>
          <h1 className="text-sm font-bold text-gray-900">ენერგო პრო</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
