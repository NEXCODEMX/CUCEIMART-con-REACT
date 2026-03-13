// src/pages/LoginPage.jsx
// CUCEI MART — Pagina de inicio de sesion | NEXCODE

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LOGO_ATOM = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <circle cx="40" cy="40" r="8" fill="white" opacity="0.95" />
    <ellipse cx="40" cy="40" rx="35" ry="14" stroke="white" strokeWidth="2.5" opacity="0.8" />
    <ellipse cx="40" cy="40" rx="35" ry="14" stroke="white" strokeWidth="2.5" opacity="0.8"
      transform="rotate(60 40 40)" />
    <ellipse cx="40" cy="40" rx="35" ry="14" stroke="white" strokeWidth="2.5" opacity="0.8"
      transform="rotate(120 40 40)" />
    <circle cx="75" cy="40" r="4" fill="white" opacity="0.9" />
    <circle cx="12" cy="68" r="4" fill="white" opacity="0.7" />
  </svg>
);

export default function LoginPage() {
  const { loginCliente, loginEmprendedor } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/';

  const [tipo,          setTipo]          = useState('cliente');
  const [identificador, setIdentificador] = useState('');
  const [contrasena,    setContrasena]    = useState('');
  const [showPass,      setShowPass]      = useState(false);
  const [loading,       setLoading]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identificador.trim() || !contrasena.trim()) {
      toast.error('Completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      if (tipo === 'cliente') {
        await loginCliente(identificador, contrasena);
        toast.success('Bienvenido de vuelta');
      } else {
        await loginEmprendedor(identificador, contrasena);
        toast.success('Bienvenido a tu panel');
      }
      navigate(tipo === 'emprendedor' ? '/panel' : from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al iniciar sesion';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* Panel izquierdo — decorativo */}
      <div className="hidden lg:flex lg:w-[45%] gradient-cucei relative overflow-hidden
                      flex-col items-center justify-center p-12 text-white">

        {/* Pattern de fondo */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border-2 border-white/40"
              style={{
                width:  `${120 + i * 80}px`,
                height: `${120 + i * 80}px`,
                top:    `${20 + i * 10}%`,
                left:   `${10 + i * 5}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>

        {/* Contenido */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
          {/* Logo animado */}
          <div className="w-24 h-24 mb-8 drop-shadow-2xl animate-pulse-gold">
            <LOGO_ATOM />
          </div>

          <h1 className="font-heading font-bold text-4xl mb-2 leading-tight">
            CUCEI MART
          </h1>
          <p className="text-white/70 font-mono text-xs tracking-widest uppercase mb-8">
            Powered by NEXCODE
          </p>

          <p className="text-white/85 text-lg leading-relaxed mb-10">
            La plataforma de emprendimiento universitario del
            <span className="font-semibold text-white"> CUCEI</span>.
            Conectamos talento, productos y comunidad.
          </p>

          {/* Stats decorativas */}
          <div className="grid grid-cols-3 gap-4 w-full">
            {[
              { icon: 'fa-store',   value: '50+',    label: 'Negocios' },
              { icon: 'fa-users',   value: '1,200+', label: 'Usuarios'  },
              { icon: 'fa-star',    value: '4.8',    label: 'Rating'    },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm border border-white/20">
                <i className={`fa-solid ${stat.icon} text-white/70 mb-1 block text-lg`} />
                <div className="font-heading font-bold text-lg">{stat.value}</div>
                <div className="text-white/60 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 text-white/40 text-xs text-center">
          Centro Universitario de Ciencias Exactas e Ingenierias
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-md">

          {/* Header mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 gradient-cucei rounded-xl flex items-center justify-center shadow-card">
              <i className="fa-solid fa-atom text-white text-sm" />
            </div>
            <div>
              <p className="font-heading font-bold text-text text-lg leading-none">
                CUCEI<span className="text-primary"> MART</span>
              </p>
              <p className="text-[10px] text-text-subtle leading-none mt-0.5">NEXCODE</p>
            </div>
          </div>

          {/* Titulo */}
          <div className="mb-8">
            <h2 className="font-heading font-bold text-3xl text-text mb-1">
              Iniciar sesion
            </h2>
            <p className="text-text-muted text-sm">
              Accede a tu cuenta de CUCEI MART
            </p>
          </div>

          {/* Selector de tipo */}
          <div className="flex bg-surface rounded-xl p-1 mb-6 border border-surface-dark">
            {[
              { id: 'cliente',     label: 'Soy alumno',      icon: 'fa-graduation-cap' },
              { id: 'emprendedor', label: 'Soy emprendedor', icon: 'fa-store' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTipo(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold
                            transition-all duration-200 select-none
                  ${tipo === t.id
                    ? 'bg-white text-primary shadow-card'
                    : 'text-text-muted hover:text-text'
                  }`}
              >
                <i className={`fa-solid ${t.icon} text-xs`} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="identificador" className="input-label">
                {tipo === 'cliente' ? 'Usuario o correo UDG' : 'Usuario o correo de contacto'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-at text-text-subtle text-sm" />
                </div>
                <input
                  id="identificador"
                  type="text"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  placeholder={tipo === 'cliente' ? 'mi_usuario o 123456@alumnos.udg.mx' : 'mi_negocio o correo@gmail.com'}
                  autoComplete="username"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="contrasena" className="input-label">
                Contrasena
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-lock text-text-subtle text-sm" />
                </div>
                <input
                  id="contrasena"
                  type={showPass ? 'text' : 'password'}
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="Tu contrasena"
                  autoComplete="current-password"
                  className="input-field pl-10 pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-subtle hover:text-text transition-colors"
                  aria-label={showPass ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                >
                  <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'} text-sm`} />
                </button>
              </div>
            </div>

            {/* Demo credentials hint */}
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-3 text-xs text-primary">
              <i className="fa-solid fa-circle-info mr-1.5" />
              <strong>Demo:</strong> usa usuario{' '}
              <code className="font-mono bg-primary/10 px-1 rounded">
                {tipo === 'cliente' ? 'ana_cucei' : 'sanza_art'}
              </code>{' '}
              — configura tu BD con el DDL adjunto para activar la conexion real.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3.5 text-base"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-right-to-bracket" />
                  Iniciar sesion
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-surface-dark" />
            <span className="text-xs text-text-subtle font-medium">O si aun no tienes cuenta</span>
            <div className="flex-1 h-px bg-surface-dark" />
          </div>

          {/* Registro */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/registro?tipo=cliente"
              className="btn-secondary text-sm py-2.5 justify-center"
            >
              <i className="fa-solid fa-graduation-cap text-xs" />
              Soy alumno
            </Link>
            <Link
              to="/registro?tipo=emprendedor"
              className="btn-secondary text-sm py-2.5 justify-center"
            >
              <i className="fa-solid fa-store text-xs" />
              Emprender
            </Link>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-text-subtle mt-8">
            Al ingresar aceptas los{' '}
            <Link to="/terminos" className="text-primary hover:underline">terminos de uso</Link>{' '}
            y la{' '}
            <Link to="/privacidad" className="text-primary hover:underline">politica de privacidad</Link>.
          </p>
          <p className="text-center text-xs text-text-subtle mt-2">
            <i className="fa-solid fa-shield-halved mr-1 text-cucei-green" />
            Plataforma exclusiva para la comunidad CUCEI
          </p>
        </div>
      </div>
    </div>
  );
}
