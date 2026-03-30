import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'
import Layout from './components/Layout.jsx'
import LoginPage from './pages/LoginPage.jsx'
import PerfilPage from './pages/PerfilPage.jsx'
import BalconistasPage from './pages/BalconistasPage.jsx'
import ServicosPage from './pages/ServicosPage.jsx'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Privadas — envolvidas pelo Layout com sidebar */}
        <Route
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/perfil" replace />} />
          <Route path="/perfil"      element={<PerfilPage />} />
          <Route path="/balconistas" element={<BalconistasPage />} />
          <Route path="/servicos"    element={<ServicosPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/perfil" replace />} />
      </Routes>
    </AuthProvider>
  )
}
