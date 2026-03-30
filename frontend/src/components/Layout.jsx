import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { Home, Store, Users, Wrench, Settings, LogOut, Menu, X } from 'lucide-react'

export default function Layout() {
  const { logout, isAdmin } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const links = [
    { to: '/home',        label: 'Home',           icon: Home },
    { to: '/perfil',      label: 'Minha Loja',     icon: Store },
    { to: '/balconistas', label: 'Balconistas',    icon: Users },
    { to: '/servicos',    label: 'Serviços',       icon: Wrench },
  ]

  if (isAdmin) {
    links.push({ to: '/admin/home', label: 'Admin. Home', icon: Settings })
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      
      {/* Mobile Topbar & Hamburger */}
      <div className="md:hidden fixed top-0 w-full bg-drogamais-500 text-white z-50 flex items-center justify-between px-4 py-3 shadow-md">
        <span className="font-bold text-lg tracking-wide">Drogamais</span>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 rounded-md bg-transparent hover:bg-drogamais-600 transition">
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Backdrop Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-100 mt-12 md:mt-0">
          <span className="font-bold text-xl text-drogamais-600 tracking-wide">Drogamais</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-drogamais-50 text-drogamais-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-drogamais-500'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 pt-16 md:pt-0 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
