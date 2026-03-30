import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

const NAV_LINKS = [
  { to: '/perfil',      label: 'Minha Loja' },
  { to: '/balconistas', label: 'Balconistas' },
  { to: '/servicos',    label: 'Serviços' },
]

export default function Layout() {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ── Topbar ── */}
      <header className="bg-drogamais-500 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-white font-bold text-lg tracking-wide">
            Drogamais · Portal do Lojista
          </span>
          <button
            onClick={logout}
            className="text-sm bg-white text-drogamais-600 font-semibold px-4 py-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl w-full mx-auto px-4 py-6 gap-6">
        {/* ── Sidebar ── */}
        <aside className="w-52 shrink-0">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    'px-4 py-2.5 rounded-lg text-sm font-medium transition',
                    isActive
                      ? 'bg-drogamais-500 text-white shadow'
                      : 'text-gray-600 hover:bg-drogamais-50 hover:text-drogamais-600',
                  ].join(' ')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* ── Conteúdo da página ── */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
