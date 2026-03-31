// src/components/Layout.jsx
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import {
  Home, Store, Users, Wrench, Settings, LogOut,
  Menu, X, ChevronLeft, ChevronRight,
} from 'lucide-react'
import LogoDrogamais from '../assets/logo-login.svg'

/* ─── larguras do sidebar ─── */
const SIDEBAR_W_EXPANDED  = '240px'
const SIDEBAR_W_COLLAPSED = '68px'

export default function Layout() {
  const { logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  /* mobile: drawer aberto/fechado */
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { to: '/home',        label: 'Home',        icon: Home },
    { to: '/perfil',      label: 'Minha Loja',  icon: Store },
    { to: '/balconistas', label: 'Balconistas',  icon: Users },
    { to: '/servicos',    label: 'Serviços',     icon: Wrench },
  ]
  if (isAdmin) {
    navLinks.push({ to: '/admin/home', label: 'Admin', icon: Settings })
  }

  /* ── Sidebar compartilhado (desktop hover + mobile drawer) ── */
  function SidebarContent({ onNavigate, isDesktop }) {
    return (
      <div className="flex flex-col h-full overflow-hidden">

        {/* ── Cabeçalho do sidebar ── */}
        <div className="h-16 flex items-center px-[17px] border-b border-slate-100 shrink-0">
          <div
            className="flex items-center flex-1 min-w-0 cursor-pointer"
            onClick={() => { navigate('/home'); onNavigate?.() }}
          >
            <img
              src={LogoDrogamais}
              alt="Drogamais"
              className="w-[34px] h-[34px] shrink-0"
            />
            {/* O Texto aparece automaticamente quando o group (sidebar) sofrer hover, ou no mobile */}
            <span className={`font-extrabold text-[15.5px] text-drogamais-500 tracking-tight ml-3 whitespace-nowrap transition-opacity duration-200
                             ${isDesktop ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} `}>
              Drogamais
            </span>
          </div>
        </div>

        {/* ── Links de navegação ── */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => onNavigate?.()}
              className={({ isActive }) =>
                `flex items-center px-2.5 py-3 rounded-[12px] text-[13.5px] font-medium
                 transition-colors relative overflow-hidden
                 ${isActive
                   ? 'bg-drogamais-50 text-drogamais-600'
                   : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                 }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* indicador lateral ativo */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-drogamais-500 rounded-r-full" />
                  )}
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`shrink-0 ${isActive ? 'text-drogamais-500' : ''}`}
                  />
                  <span className={`ml-4 whitespace-nowrap transition-opacity duration-200
                                   ${isDesktop ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── Rodapé: botão sair ── */}
        <div className="p-3 border-t border-slate-100 shrink-0">
          <button
            onClick={() => { logout(); onNavigate?.() }}
            className="flex items-center w-full px-2.5 py-3 text-[13.5px] font-medium
                       text-slate-500 hover:bg-red-50 hover:text-drogamais-600 rounded-[12px]
                       transition-colors overflow-hidden"
          >
            <LogOut size={20} className="shrink-0" strokeWidth={2} />
            <span className={`ml-4 whitespace-nowrap transition-opacity duration-200
                             ${isDesktop ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
              Sair
            </span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">

      {/* ════════════════════════════════
          MOBILE: Topbar + Drawer
      ════════════════════════════════ */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-slate-100
                      z-30 flex items-center justify-between px-4 shadow-sm">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 transition"
        >
          <Menu size={22} />
        </button>
        <img src={LogoDrogamais} alt="Drogamais" className="w-7 h-7" />
        <div className="w-8" />
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-white z-50 shadow-2xl
                    transition-transform duration-300 md:hidden
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                    w-[240px]`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400
                     hover:bg-slate-100 transition"
        >
          <X size={20} />
        </button>
        <SidebarContent onNavigate={() => setMobileOpen(false)} isDesktop={false} />
      </aside>

      {/* ════════════════════════════════
          DESKTOP: Sidebar Flutuante (Hover)
      ════════════════════════════════ */}
      
      {/* Spacer DUMMY invisível para não repuxar o layout (ocupa fixo os 68px) */}
      <div className="hidden md:block shrink-0" style={{ width: SIDEBAR_W_COLLAPSED }} />

      {/* Sidebar FIXADA sobre o layout, cresce pura e sutilmente com CSS Group-Hover */}
      <aside
        className="hidden md:flex flex-col h-screen fixed top-0 left-0 bg-white z-50
                   border-r border-slate-100 group shadow-sm hover:shadow-[10px_0_30px_rgba(0,0,0,0.08)]
                   transition-[width,box-shadow] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
        style={{ width: SIDEBAR_W_COLLAPSED }}
        onMouseEnter={(e) => e.currentTarget.style.width = SIDEBAR_W_EXPANDED}
        onMouseLeave={(e) => e.currentTarget.style.width = SIDEBAR_W_COLLAPSED}
      >
        <SidebarContent isDesktop={true} />
      </aside>

      {/* ════════════════════════════════
          ÁREA DE CONTEÚDO PRINCIPAL
      ════════════════════════════════ */}
      <main className="flex-1 min-w-0 flex flex-col pt-14 md:pt-0">
        <div className="flex-1 p-4 md:p-8 max-w-[1800px] w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
