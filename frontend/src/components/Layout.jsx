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
const SIDEBAR_W_EXPANDED  = 'w-[240px]'
const SIDEBAR_W_COLLAPSED = 'w-[68px]'

export default function Layout() {
  const { logout, isAdmin, user } = useAuth()
  const navigate = useNavigate()

  /* mobile: drawer aberto/fechado */
  const [mobileOpen, setMobileOpen] = useState(false)
  /* desktop: sidebar expandida/colapsada */
  const [collapsed, setCollapsed] = useState(false)

  const navLinks = [
    { to: '/home',        label: 'Home',        icon: Home },
    { to: '/perfil',      label: 'Minha Loja',  icon: Store },
    { to: '/balconistas', label: 'Balconistas',  icon: Users },
    { to: '/servicos',    label: 'Serviços',     icon: Wrench },
  ]
  if (isAdmin) {
    navLinks.push({ to: '/admin/home', label: 'Admin', icon: Settings })
  }

  /* ── Sidebar compartilhado (desktop + mobile drawer) ── */
  function SidebarContent({ onNavigate }) {
    return (
      <div className="flex flex-col h-full">

        {/* ── Cabeçalho do sidebar ── */}
        <div className="h-16 flex items-center px-4 border-b border-slate-100 shrink-0">
          {/* Logo */}
          <div
            className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
            onClick={() => { navigate('/home'); onNavigate?.() }}
          >
            <img
              src={LogoDrogamais}
              alt="Drogamais"
              className="w-8 h-8 shrink-0"
            />
            {!collapsed && (
              <span className="font-extrabold text-[15px] text-drogamais-500 tracking-tight truncate">
                Drogamais
              </span>
            )}
          </div>

          {/* Botão colapsar (só desktop) */}
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expandir menu' : 'Colapsar menu'}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400
                       hover:text-drogamais-500 hover:bg-drogamais-50 transition-all shrink-0"
          >
            {collapsed
              ? <ChevronRight size={16} strokeWidth={2.5} />
              : <ChevronLeft  size={16} strokeWidth={2.5} />
            }
          </button>
        </div>

        {/* ── Links de navegação ── */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => onNavigate?.()}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium
                 transition-all duration-150 group relative
                 ${isActive
                   ? 'bg-drogamais-50 text-drogamais-600'
                   : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                 }
                 ${collapsed ? 'justify-center' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  {/* indicador lateral ativo */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-drogamais-500 rounded-r-full" />
                  )}
                  <Icon
                    size={18}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className="shrink-0"
                  />
                  {!collapsed && <span>{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── Rodapé: botão sair ── */}
        <div className="p-2 border-t border-slate-100 shrink-0">
          <button
            onClick={() => { logout(); onNavigate?.() }}
            title={collapsed ? 'Sair' : undefined}
            className={`flex items-center gap-3 w-full px-3 py-2.5 text-[13.5px] font-medium
                        text-slate-500 hover:bg-red-50 hover:text-drogamais-600 rounded-xl
                        transition-all duration-150
                        ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={18} strokeWidth={1.8} className="shrink-0" />
            {!collapsed && <span>Sair</span>}
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
      {/* Topbar mobile */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-slate-100
                      z-50 flex items-center justify-between px-4 shadow-sm">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 transition"
        >
          <Menu size={22} />
        </button>
        <img src={LogoDrogamais} alt="Drogamais" className="w-7 h-7" />
        <div className="w-8" /> {/* espaçador */}
      </div>

      {/* Backdrop mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Drawer mobile */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white z-50 shadow-2xl
                    transition-transform duration-300 md:hidden
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                    w-[240px]`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400
                     hover:bg-slate-100 transition"
        >
          <X size={18} />
        </button>
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* ════════════════════════════════
          DESKTOP: Sidebar fixa/sticky
      ════════════════════════════════ */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 bg-white
                    border-r border-slate-100 shrink-0
                    transition-all duration-250 ease-in-out
                    ${collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED}`}
      >
        <SidebarContent />
      </aside>

      {/* ════════════════════════════════
          ÁREA DE CONTEÚDO PRINCIPAL
      ════════════════════════════════ */}
      <main className="flex-1 min-w-0 flex flex-col pt-14 md:pt-0">
        <div className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
