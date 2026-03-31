import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import api from '../services/api.js'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import LogoDrogamais from '../assets/logo-login.svg'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', senha: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false) // Novo estado para ver a senha

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
      setError('Credenciais inválidas. Verifique o seu e-mail e senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    // Fundo modernizado: Gradiente suave em vez de uma cor sólida, com um padrão subtil
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-drogamais-600 via-drogamais-500 to-drogamais-800 relative overflow-hidden">
      
      {/* Padrão de fundo subtil (opcional, dá um toque de profundidade) */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
      ></div>

      {/* Cartão de Login: Efeito glassmorphism muito suave, cantos mais arredondados (3xl) e sombra profunda */}
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-10 w-full max-w-md relative z-10 mx-4">
        
        <div className="text-center mb-10">
          <img src={LogoDrogamais} alt="Ícone Drogamais" className="w-20 h-20 mb-4"/>
          <h1 className="text-4xl font-extrabold text-drogamais-600 tracking-tight">Drogamais</h1>
          <p className="text-gray-500 mt-2 font-medium">Portal do Lojista</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Campo E-mail */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Mail size={20} />
              </div>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-drogamais-500 focus:border-transparent transition-all bg-gray-50 hover:bg-gray-100 focus:bg-white"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock size={20} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-drogamais-500 focus:border-transparent transition-all bg-gray-50 hover:bg-gray-100 focus:bg-white"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-drogamais-500 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Link: Esqueceu a senha (Pode ajustar a rota futuramente) */}
          <div className="flex justify-end">
            <a href="#" className="text-sm font-medium text-drogamais-500 hover:text-drogamais-600 hover:underline transition-all">
              Esqueceu a senha?
            </a>
          </div>

          {/* Mensagem de Erro mais elegante */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg animate-in fade-in slide-in-from-top-2">
              <p className="text-sm text-red-700 font-medium">
                {error}
              </p>
            </div>
          )}

          {/* Botão de Submit: Gradiente e animação on hover */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-drogamais-500 to-drogamais-600 hover:from-drogamais-600 hover:to-drogamais-700 text-white font-bold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-70 shadow-lg shadow-drogamais-500/30 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? 'A entrar...' : 'Entrar no Portal'}
          </button>
        </form>
      </div>
    </div>
  )
}