// src/components/Navbar.jsx
// CUCEI MART — Barra de navegacion principal | NEXCODE

import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInitials, generateAvatarColor } from '../utils/helpers';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
  const [scrolled,   setScrolled]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [dropOpen,   setDropOpen]   = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => setMenuOpen(false), [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const avatarBg = user ? generateAvatarColor(user.nombre_usuario || user.nombre_negocio || '') : '#0052CC';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300
      ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-card border-b border-surface-dark' : 'bg-white border-b border-surface-dark'}`}
    >
      <div className="page-container">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 gradient-cucei rounded-xl flex items-center justify-center shadow-card
                            group-hover:shadow-hover transition-all duration-200">
              <i className="fa-solid fa-atom text-white text-sm" />
            </div>
            <div className="hidden sm:block">
              <span className="font-heading font-bold text-lg text-text leading-none tracking-tight">
                CUCEI<span className="text-primary"> MART</span>
              </span>
              <p className="text-[10px] text-text-subtle font-medium leading-none mt-0.5">
                NEXCODE
              </p>
            </div>
          </Link>

          {/* Nav links — desktop */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/"            className={`nav-link ${isActive('/') ? 'active' : ''}`}>Inicio</Link>
            <Link to="/tienda"      className={`nav-link ${isActive('/tienda') ? 'active' : ''}`}>Tienda</Link>
            <Link to="/emprendedores" className={`nav-link ${isActive('/emprendedores') ? 'active' : ''}`}>Emprendedores</Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                             hover:bg-surface transition-all duration-200 group"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-card"
                    style={{ backgroundColor: avatarBg }}
                  >
                    {getInitials(user?.nombre_negocio || user?.nombre || '')}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-text leading-none">
                      {user?.nombre_negocio || user?.nombre}
                    </p>
                    <p className="text-[10px] text-text-subtle leading-none mt-0.5 capitalize">
                      {user?.tipo}
                    </p>
                  </div>
                  <i className={`fa-solid fa-chevron-down text-text-subtle text-xs transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl2 shadow-hover border border-surface-dark
                                  animate-fade-up z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-surface-dark">
                      <p className="text-xs font-semibold text-text truncate">
                        {user?.nombre_negocio || `${user?.nombre} ${user?.apellido_paterno || ''}`}
                      </p>
                      <p className="text-[11px] text-text-subtle truncate capitalize">{user?.tipo}</p>
                    </div>

                    {user?.tipo === 'emprendedor' && (
                      <>
                        <Link to="/panel" onClick={() => setDropOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-surface transition-colors">
                          <i className="fa-solid fa-chart-line text-primary w-4 text-center" />
                          Mi Panel
                        </Link>
                        <Link to="/panel/productos" onClick={() => setDropOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-surface transition-colors">
                          <i className="fa-solid fa-box text-primary w-4 text-center" />
                          Mis Productos
                        </Link>
                      </>
                    )}
                    {user?.tipo === 'cliente' && (
                      <Link to="/perfil" onClick={() => setDropOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-surface transition-colors">
                        <i className="fa-solid fa-user text-primary w-4 text-center" />
                        Mi Perfil
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-accent
                                 hover:bg-accent/5 transition-colors border-t border-surface-dark"
                    >
                      <i className="fa-solid fa-right-from-bracket w-4 text-center" />
                      Cerrar sesion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm hidden sm:inline-flex">
                  Iniciar sesion
                </Link>
                <Link to="/registro" className="btn-primary text-sm py-2 px-4">
                  <i className="fa-solid fa-rocket text-xs" />
                  Unirme
                </Link>
              </div>
            )}

            {/* Hamburger — mobile */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="btn-icon md:hidden ml-1"
              aria-label="Menu"
            >
              <i className={`fa-solid ${menuOpen ? 'fa-xmark' : 'fa-bars'} text-sm`} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-surface-dark py-3 space-y-1 animate-fade-up">
            <Link to="/"             className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-text hover:bg-surface">
              <i className="fa-solid fa-house w-4 text-center text-text-muted" /> Inicio
            </Link>
            <Link to="/tienda"       className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-text hover:bg-surface">
              <i className="fa-solid fa-store w-4 text-center text-text-muted" /> Tienda
            </Link>
            <Link to="/emprendedores" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-text hover:bg-surface">
              <i className="fa-solid fa-users w-4 text-center text-text-muted" /> Emprendedores
            </Link>
            {!isAuthenticated && (
              <Link to="/login" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary/5">
                <i className="fa-solid fa-right-to-bracket w-4 text-center" /> Iniciar sesion
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
