// src/pages/LoginPage.jsx
import { useState, useId } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import api from '../services/api.js'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import LogoDrogamais from '../assets/logo-login.svg'
import BackgroundArt from '../components/BackgroundArt.jsx'

export default function LoginPage() {
  const { login }   = useAuth()
  const navigate    = useNavigate()
  const emailId     = useId()
  const senhaId     = useId()

  const [form, setForm]         = useState({ email: '', senha: '' })
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', form)
      login(data.token)
      navigate('/', { replace: true })
    } catch (err) {
      console.error('[login] erro:', err.response?.data ?? err.message)
      setError('E-mail ou senha incorretos. Verifique as suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative font-sans text-slate-900">
      
      {/* Importa a arte de fundo limpa */}
      <BackgroundArt />

      {/* ── CARD PRINCIPAL ── */}
      <div className="relative z-10 w-full max-w-[420px] mx-4 p-10 bg-white/95 backdrop-blur-xl rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white">
        
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <img
            src={LogoDrogamais}
            alt="Logo Drogamais"
            className="w-20 h-20 mx-auto mb-4 drop-shadow-sm"
          />
          <h1 
            className="text-3xl font-[750] text-drogamais-500 tracking-tight leading-tight"
            style={{ fontFamily: "'Gotham', sans-serif" }}
          >
            DROGAMAIS
          </h1>
          <p className="text-[13.5px] font-medium text-slate-500 mt-1">
            Portal do Lojista
          </p>
          <div className="w-10 h-0.5 mx-auto mt-4 bg-gradient-to-r from-transparent via-drogamais-500/40 to-transparent rounded-full" />
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          
          {/* Campo E-mail */}
          <div>
            <label htmlFor={emailId} className="block text-[12.5px] font-semibold text-slate-600 mb-2 uppercase tracking-wide">
              E-mail
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-drogamais-500 transition-colors">
                <Mail size={18} />
              </span>
              <input
                id={emailId}
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="seu@email.com"
                className="w-full pl-11 pr-4 py-3 text-[14.5px] text-slate-800 bg-slate-50 border border-slate-200 shadow-sm rounded-xl outline-none transition-all hover:bg-slate-100 hover:border-slate-300 focus:bg-white focus:border-drogamais-500 focus:ring-4 focus:ring-drogamais-500/15 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor={senhaId} className="block text-[12.5px] font-semibold text-slate-600 uppercase tracking-wide">
                Senha
              </label>
              <a href="#" className="text-[12.5px] font-medium text-slate-400 hover:text-drogamais-500 transition-colors">
                Esqueceu a senha?
              </a>
            </div>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-drogamais-500 transition-colors">
                <Lock size={18} />
              </span>
              <input
                id={senhaId}
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3 text-[14.5px] text-slate-800 bg-slate-50 border border-slate-200 shadow-sm rounded-xl outline-none transition-all hover:bg-slate-100 hover:border-slate-300 focus:bg-white focus:border-drogamais-500 focus:ring-4 focus:ring-drogamais-500/15 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-drogamais-500 transition-colors outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div role="alert" className="flex items-start gap-2.5 bg-red-50 border border-red-100 border-l-4 border-l-drogamais-500 rounded-lg p-3 animate-in fade-in zoom-in-95">
              <AlertCircle size={16} className="text-drogamais-500 shrink-0 mt-0.5" />
              <p className="m-0 text-[13px] font-medium text-red-800 leading-snug">
                {error}
              </p>
            </div>
          )}

          {/* Botão Call to Action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 text-[15px] font-bold text-white tracking-wide bg-drogamais-500 rounded-xl transition-all duration-200 outline-none shadow-[0_8px_24px_rgba(232,0,28,0.25)] hover:bg-drogamais-600 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(232,0,28,0.35)] active:translate-y-0 active:shadow-[0_4px_12px_rgba(232,0,28,0.25)] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'A entrar...' : 'Entrar no Portal'}
          </button>
        </form>

        {/* Rodapé do Card */}
        <p className="text-center mt-8 text-[11.5px] text-slate-400 tracking-wide">
          © {new Date().getFullYear()} Drogamais · Uso exclusivo de lojistas
        </p>
      </div>
    </div>
  )
}