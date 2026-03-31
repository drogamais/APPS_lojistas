import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import {
  Home, Store, Users, Wrench, Settings, LogOut,
  Menu, X, Sun, Moon,
  Mail, MapPin, Hash
} from 'lucide-react'
import LogoDrogamais from '../assets/logo-login.svg'

/* ─── larguras do sidebar ─── */
const SIDEBAR_W_EXPANDED  = '240px'
const SIDEBAR_W_COLLAPSED = '68px'

export default function Layout() {
  const { logout, isAdmin, userDetails } = useAuth()
  const navigate = useNavigate()

  /* Dark Mode State */
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark'
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

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
      <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800">

        {/* ── Cabeçalho do sidebar ── */}
        <div className="h-16 flex items-center px-[17px] border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div
            className="flex items-center flex-1 min-w-0 cursor-pointer"
            onClick={() => { navigate('/home'); onNavigate?.() }}
          >
            <img
              src={LogoDrogamais}
              alt="Drogamais"
              className="w-[34px] h-[34px] shrink-0"
            />
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
                   ? 'bg-drogamais-50 dark:bg-drogamais-500/10 text-drogamais-600 dark:text-drogamais-400'
                   : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
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
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            onClick={() => { logout(); onNavigate?.() }}
            className="flex items-center w-full px-2.5 py-3 text-[13.5px] font-medium
                       text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-drogamais-600 rounded-[12px]
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
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">

      {/* ════════════════════════════════
          MOBILE: Topbar + Drawer
      ════════════════════════════════ */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800
                      z-30 flex items-center justify-between px-4 shadow-sm">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <Menu size={22} />
        </button>
        <img src={LogoDrogamais} alt="Drogamais" className="w-7 h-7" />
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-yellow-400"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-white dark:bg-slate-900 z-50 shadow-2xl
                    transition-transform duration-300 md:hidden
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                    w-[240px]`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400
                     hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X size={20} />
        </button>
        <SidebarContent onNavigate={() => setMobileOpen(false)} isDesktop={false} />
      </aside>

      {/* ════════════════════════════════
          DESKTOP: Sidebar Flutuante (Hover)
      ════════════════════════════════ */}
      <div className="hidden md:block shrink-0" style={{ width: SIDEBAR_W_COLLAPSED }} />

      <aside
        className="hidden md:flex flex-col h-screen fixed top-0 left-0 bg-white dark:bg-slate-900 z-50
                   border-r border-slate-100 dark:border-slate-800 group shadow-sm hover:shadow-[10px_0_30px_rgba(0,0,0,0.12)]
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
        
        {/* TOP BAR / HEADER INFORMATIVO */}
        <header className="h-12 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-[11px] font-medium tracking-wider uppercase hidden sm:block">Dashboard Lojista</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-yellow-400 hover:shadow-sm transition-all group"
              title={darkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
            >
              {darkMode ? <Sun size={17} className="group-hover:rotate-45 transition-transform" /> : <Moon size={17} className="group-hover:-rotate-12 transition-transform" />}
            </button>

            {/* User Details */}
            {userDetails && (
              <div className="flex items-center gap-3 border-l border-slate-100 dark:border-slate-800 pl-4 h-7">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
                    <span className="text-[12px] font-bold truncate max-w-[180px]">{userDetails.email || 'Usuário'}</span>
                    <Mail size={11} className="text-slate-300" />
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <span className="text-[10px] font-semibold tabular-nums">
                      L{userDetails.loja_numero || '--'} — {userDetails.nome_fantasia || '--'}
                    </span>
                    <Hash size={9} className="text-slate-300" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content Overflow Area */}
        <div className="flex-1 p-3 md:p-4 max-w-[1800px] w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
