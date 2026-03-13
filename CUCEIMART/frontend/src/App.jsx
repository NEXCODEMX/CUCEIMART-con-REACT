// src/App.jsx
// CUCEI MART — Aplicacion principal | NEXCODE

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TiendaPage from './pages/TiendaPage';
import EmprendedorDetailPage from './pages/EmprendedorDetailPage';
import PanelEmprendedorPage from './pages/PanelEmprendedorPage';
import './styles/globals.css';

// ─── RUTA PROTEGIDA ───────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, tipo }) => {
  const { isAuthenticated, isEmprendedor, isCliente, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 gradient-cucei rounded-xl flex items-center justify-center shadow-card animate-pulse">
          <i className="fa-solid fa-atom text-white text-base" />
        </div>
        <p className="text-text-muted text-sm">Cargando CUCEI MART...</p>
      </div>
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (tipo === 'emprendedor' && !isEmprendedor) return <Navigate to="/" replace />;
  if (tipo === 'cliente'     && !isCliente)     return <Navigate to="/" replace />;
  return children;
};

// ─── LAYOUT CON NAVBAR ───────────────────────────────────────────────────────
const WithNav = ({ children }) => (
  <>
    <Navbar />
    {children}
  </>
);

// ─── APP ROUTES ───────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Publicas con navbar */}
      <Route path="/" element={<WithNav><HomePage /></WithNav>} />
      <Route path="/tienda" element={<WithNav><TiendaPage /></WithNav>} />
      <Route path="/emprendedores" element={<WithNav><TiendaPage /></WithNav>} />
      <Route path="/emprendedores/:slug" element={<WithNav><EmprendedorDetailPage /></WithNav>} />

      {/* Auth — sin navbar */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />

      {/* Protegidas */}
      <Route path="/panel" element={
        <ProtectedRoute tipo="emprendedor">
          <WithNav><PanelEmprendedorPage /></WithNav>
        </ProtectedRoute>
      } />
      <Route path="/panel/productos" element={
        <ProtectedRoute tipo="emprendedor">
          <WithNav><PanelEmprendedorPage /></WithNav>
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={
        <WithNav>
          <div className="pt-16 min-h-screen flex items-center justify-center">
            <div className="text-center">
              <p className="text-8xl font-heading font-bold text-surface-dark mb-4">404</p>
              <h2 className="font-heading font-bold text-2xl text-text mb-2">Pagina no encontrada</h2>
              <p className="text-text-muted mb-6">La pagina que buscas no existe.</p>
              <a href="/" className="btn-primary">
                <i className="fa-solid fa-house" />
                Ir al inicio
              </a>
            </div>
          </div>
        </WithNav>
      } />
    </Routes>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '14px',
              borderRadius: '12px',
              boxShadow: '0 4px 24px rgba(23,43,77,0.15)',
            },
            success: {
              iconTheme: { primary: '#00875A', secondary: '#fff' },
              style: { background: '#fff', color: '#172B4D', borderLeft: '4px solid #00875A' },
            },
            error: {
              iconTheme: { primary: '#FF5630', secondary: '#fff' },
              style: { background: '#fff', color: '#172B4D', borderLeft: '4px solid #FF5630' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
