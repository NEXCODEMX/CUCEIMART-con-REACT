// src/pages/EmprendedorDetailPage.jsx
// CUCEI MART — Perfil publico de emprendedor | NEXCODE

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { emprendedoresAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StarDisplay, StarInput } from '../components/StarRating';
import {
  formatPrice, formatDate, getCategoryLabel, getCategoryIcon,
  getInitials, generateAvatarColor, MEMBRESIA_CONFIG
} from '../utils/helpers';
import toast from 'react-hot-toast';

// ─── RESENA CARD ─────────────────────────────────────────────────────────────
const ResenaCard = ({ resena }) => {
  const bg = generateAvatarColor(resena.autor_usuario || '');
  return (
    <div className="card p-4">
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ backgroundColor: bg }}
        >
          {getInitials(resena.autor_usuario || 'U')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-text">@{resena.autor_usuario}</p>
            <span className="text-xs text-text-subtle">{formatDate(resena.creado_en)}</span>
          </div>
          <StarDisplay rating={resena.calificacion} showCount={false} />
        </div>
      </div>

      {resena.titulo && (
        <p className="font-semibold text-text text-sm mb-1">{resena.titulo}</p>
      )}
      <p className="text-sm text-text-muted leading-relaxed">{resena.comentario}</p>

      {resena.respuesta_emprendedor && (
        <div className="mt-3 bg-primary/5 border-l-2 border-primary rounded-r-lg p-3">
          <p className="text-xs font-semibold text-primary mb-1">
            <i className="fa-solid fa-store mr-1" />
            Respuesta del emprendedor
          </p>
          <p className="text-xs text-text-muted">{resena.respuesta_emprendedor}</p>
        </div>
      )}
    </div>
  );
};

// ─── MODAL RESENA ─────────────────────────────────────────────────────────────
const ModalResena = ({ emprendedor, onClose, onSuccess }) => {
  const { isAuthenticated, isCliente, user } = useAuth();
  const [calificacion, setCalificacion] = useState(0);
  const [titulo,       setTitulo]       = useState('');
  const [comentario,   setComentario]   = useState('');
  const [loading,      setLoading]      = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!calificacion) { toast.error('Selecciona una calificacion'); return; }
    if (comentario.trim().length < 10) { toast.error('El comentario debe tener al menos 10 caracteres'); return; }

    setLoading(true);
    try {
      await emprendedoresAPI.crearResena(emprendedor.id_emprendedor, {
        calificacion, titulo: titulo.trim() || undefined,
        comentario: comentario.trim(),
      });
      toast.success('Resena publicada exitosamente');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al publicar la resena');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex items-center justify-between p-5 border-b border-surface-dark">
          <h3 className="font-heading font-bold text-lg text-text">
            Dejar una resena
          </h3>
          <button onClick={onClose} className="btn-icon w-8 h-8 rounded-lg text-sm">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="p-6 text-center">
            <i className="fa-solid fa-lock text-4xl text-text-subtle mb-3 block" />
            <p className="text-text-muted mb-4">Debes iniciar sesion para dejar una resena.</p>
            <Link to="/login" className="btn-primary">Iniciar sesion</Link>
          </div>
        ) : !isCliente ? (
          <div className="p-6 text-center">
            <i className="fa-solid fa-circle-info text-4xl text-primary mb-3 block" />
            <p className="text-text-muted">Solo los alumnos pueden dejar resenas.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="input-label mb-2">Calificacion</label>
              <StarInput value={calificacion} onChange={setCalificacion} />
            </div>
            <div>
              <label className="input-label">Titulo (opcional)</label>
              <input
                type="text" value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Resumen de tu experiencia"
                maxLength={100} className="input-field"
              />
            </div>
            <div>
              <label className="input-label">
                Comentario <span className="text-accent">*</span>
              </label>
              <textarea
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                placeholder="Comparte tu experiencia con este emprendimiento (minimo 10 caracteres)..."
                rows={4} maxLength={1000}
                className="input-field resize-none"
                required
              />
              <p className="text-xs text-text-subtle mt-1 text-right">{comentario.length}/1000</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Publicando...</> : <>
                  <i className="fa-solid fa-paper-plane" /> Publicar resena
                </>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function EmprendedorDetailPage() {
  const { slug }          = useParams();
  const { isAuthenticated, isCliente } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('productos');

  const cargar = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await emprendedoresAPI.obtener(slug);
      setData(res.data.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [slug]);

  if (loading) return (
    <div className="pt-16 min-h-screen">
      <div className="page-container py-10 space-y-5">
        <div className="skeleton h-48 rounded-xl3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-3">
            <div className="skeleton h-8 w-2/3 rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-3/4 rounded" />
          </div>
          <div className="skeleton h-40 rounded-xl2" />
        </div>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="pt-16 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <i className="fa-solid fa-circle-exclamation text-5xl text-accent mb-4 block" />
        <h2 className="font-heading font-bold text-2xl text-text mb-2">Emprendimiento no encontrado</h2>
        <p className="text-text-muted mb-5">El negocio que buscas no existe o no esta disponible.</p>
        <Link to="/tienda" className="btn-primary">Volver a la tienda</Link>
      </div>
    </div>
  );

  const avatarBg  = generateAvatarColor(data.nombre_negocio || '');
  const memConfig = MEMBRESIA_CONFIG[data.nivel_membresia] || MEMBRESIA_CONFIG.basico;
  const resenas   = data.resenas || [];
  const productos = data.productos || [];

  // Distribucion de estrellas para histograma
  const distEstrellas = [5,4,3,2,1].map(n => ({
    n,
    count: resenas.filter(r => r.calificacion === n).length,
    pct:   resenas.length ? Math.round((resenas.filter(r => r.calificacion === n).length / resenas.length) * 100) : 0,
  }));

  return (
    <div className="pt-16 min-h-screen">
      {/* Hero del emprendedor */}
      <div className="gradient-cucei relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white rounded-full -translate-y-20 translate-x-20" />
        </div>
        <div className="page-container py-10 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div
              className="w-20 h-20 rounded-xl3 flex items-center justify-center text-white font-heading font-bold text-3xl shadow-lg border-2 border-white/30 shrink-0"
              style={{ backgroundColor: avatarBg }}
            >
              {getInitials(data.nombre_negocio)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="font-heading font-bold text-2xl sm:text-3xl text-white leading-tight">
                  {data.nombre_negocio}
                </h1>
                <span className={`${memConfig.color} !bg-white/15 !text-white`}>
                  <i className={`fa-solid ${memConfig.icon} mr-1`} />
                  {memConfig.label}
                </span>
              </div>
              <p className="text-white/70 text-sm mb-2">
                <i className={`fa-solid ${getCategoryIcon(data.categoria_principal)} mr-1.5`} />
                {getCategoryLabel(data.categoria_principal)}
                {data.num_verificacion && (
                  <span className="ml-3 font-mono text-xs text-white/50">
                    {data.num_verificacion}
                  </span>
                )}
              </p>
              <div className="flex items-center gap-4">
                <StarDisplay rating={parseFloat(data.reputacion_promedio) || 0} total={data.total_resenas} size="md" />
                <span className="text-white/60 text-xs">
                  <i className="fa-solid fa-box mr-1" />
                  {data.total_productos} productos
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
              {data.whatsapp && (
                <a href={`https://wa.me/${data.whatsapp}`} target="_blank" rel="noopener noreferrer"
                  className="btn-accent text-sm px-5 py-2.5">
                  <i className="fa-brands fa-whatsapp" />
                  Contactar
                </a>
              )}
              <button
                onClick={() => setShowModal(true)}
                className="btn-secondary !text-white !border-white/40 hover:!bg-white/15 text-sm px-5 py-2.5"
              >
                <i className="fa-solid fa-star" />
                Dejar resena
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">

          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Descripcion */}
            {(data.descripcion_corta || data.descripcion_larga) && (
              <div className="card p-5">
                <h2 className="font-heading font-bold text-lg text-text mb-3">
                  <i className="fa-solid fa-circle-info text-primary mr-2" />
                  Acerca del negocio
                </h2>
                <p className="text-text-muted leading-relaxed text-sm">
                  {data.descripcion_larga || data.descripcion_corta}
                </p>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-surface rounded-xl p-1 border border-surface-dark">
              {[
                { id: 'productos', label: 'Productos', icon: 'fa-box', count: productos.length },
                { id: 'resenas',   label: 'Resenas',  icon: 'fa-star', count: resenas.length },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold
                              transition-all duration-200 select-none
                    ${activeTab === t.id ? 'bg-white text-primary shadow-card' : 'text-text-muted hover:text-text'}`}
                >
                  <i className={`fa-solid ${t.icon} text-xs`} />
                  {t.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === t.id ? 'bg-primary/10 text-primary' : 'bg-surface-dark text-text-subtle'}`}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Productos */}
            {activeTab === 'productos' && (
              <div>
                {productos.length === 0 ? (
                  <div className="card p-8 text-center">
                    <i className="fa-solid fa-box-open text-4xl text-surface-dark mb-3 block" />
                    <p className="text-text-muted">Este emprendimiento aun no ha publicado productos.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {productos.map(p => (
                      <div key={p.id_producto} className="card p-4 hover:shadow-hover transition-all duration-200">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center shrink-0 border border-surface-dark">
                            <i className={`fa-solid ${getCategoryIcon(p.categoria_principal)} text-text-subtle`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <p className="font-semibold text-text text-sm leading-tight truncate">{p.nombre}</p>
                              {p.es_destacado && (
                                <span className="badge-gold shrink-0 text-[10px]">
                                  <i className="fa-solid fa-fire" />
                                </span>
                              )}
                            </div>
                            {p.descripcion_corta && (
                              <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{p.descripcion_corta}</p>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <span className="font-bold text-primary text-sm">
                                {p.precio_texto || (p.precio === 0 ? 'Gratis' : formatPrice(p.precio))}
                              </span>
                              <StarDisplay rating={parseFloat(p.calificacion_prom) || 0} total={p.total_resenas} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Resenas */}
            {activeTab === 'resenas' && (
              <div className="space-y-4">
                {/* Histograma */}
                {resenas.length > 0 && (
                  <div className="card p-5">
                    <div className="flex items-center gap-5">
                      <div className="text-center shrink-0">
                        <div className="font-heading font-bold text-5xl text-text">
                          {parseFloat(data.reputacion_promedio).toFixed(1)}
                        </div>
                        <StarDisplay rating={parseFloat(data.reputacion_promedio) || 0} size="md" showCount={false} />
                        <p className="text-xs text-text-muted mt-1">{data.total_resenas} resenas</p>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        {distEstrellas.map(({ n, count, pct }) => (
                          <div key={n} className="flex items-center gap-2">
                            <span className="text-xs text-text-muted w-4 text-right">{n}</span>
                            <i className="fa-solid fa-star text-gold text-xs" />
                            <div className="flex-1 bg-surface-dark rounded-full h-2 overflow-hidden">
                              <div className="h-full bg-gold rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-text-subtle w-6 text-right">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <button onClick={() => setShowModal(true)} className="btn-primary w-full justify-center">
                  <i className="fa-solid fa-pen-to-square" />
                  Escribir una resena
                </button>

                {resenas.length === 0 ? (
                  <div className="card p-8 text-center">
                    <i className="fa-regular fa-star text-4xl text-surface-dark mb-3 block" />
                    <p className="text-text-muted mb-1">Sin resenas aun.</p>
                    <p className="text-sm text-text-subtle">Se el primero en dejar tu opinion.</p>
                  </div>
                ) : (
                  resenas.map(r => <ResenaCard key={r.id_resena} resena={r} />)
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Contacto */}
            <div className="card p-5">
              <h3 className="font-heading font-bold text-base text-text mb-4">
                <i className="fa-solid fa-address-card text-primary mr-2" />
                Contacto
              </h3>
              <div className="space-y-3">
                {data.whatsapp && (
                  <a href={`https://wa.me/${data.whatsapp}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-green-50 border border-green-100 hover:bg-green-100 transition-colors group">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <i className="fa-brands fa-whatsapp text-white text-sm" />
                    </div>
                    <div>
                      <p className="text-xs text-green-700 font-medium">WhatsApp</p>
                      <p className="text-xs text-green-600">{data.whatsapp}</p>
                    </div>
                  </a>
                )}
                {data.instagram && (
                  <a href={data.instagram} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-pink-50 border border-pink-100 hover:bg-pink-100 transition-colors">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <i className="fa-brands fa-instagram text-white text-sm" />
                    </div>
                    <div>
                      <p className="text-xs text-pink-700 font-medium">Instagram</p>
                      <p className="text-xs text-pink-600 truncate max-w-[120px]">{data.instagram.replace('https://www.instagram.com/','@').replace('/','')}</p>
                    </div>
                  </a>
                )}
                {data.website_externo && (
                  <a href={data.website_externo} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-primary/5 border border-primary/15 hover:bg-primary/10 transition-colors">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <i className="fa-solid fa-globe text-white text-sm" />
                    </div>
                    <div>
                      <p className="text-xs text-primary font-medium">Sitio web</p>
                      <p className="text-xs text-primary/70 truncate max-w-[120px]">Ver sitio</p>
                    </div>
                  </a>
                )}
              </div>
            </div>

            {/* Precios */}
            {(data.precio_minimo !== null || data.precio_texto) && (
              <div className="card p-5">
                <h3 className="font-heading font-bold text-base text-text mb-3">
                  <i className="fa-solid fa-tag text-primary mr-2" />
                  Precios
                </h3>
                {data.precio_texto ? (
                  <p className="font-semibold text-primary">{data.precio_texto}</p>
                ) : (
                  <div className="space-y-1 text-sm">
                    {data.precio_minimo !== null && (
                      <div className="flex justify-between">
                        <span className="text-text-muted">Desde</span>
                        <span className="font-semibold text-primary">{formatPrice(data.precio_minimo)}</span>
                      </div>
                    )}
                    {data.precio_maximo !== null && (
                      <div className="flex justify-between">
                        <span className="text-text-muted">Hasta</span>
                        <span className="font-semibold text-text">{formatPrice(data.precio_maximo)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Ubicacion */}
            {data.edificio_id && (
              <div className="card p-5">
                <h3 className="font-heading font-bold text-base text-text mb-3">
                  <i className="fa-solid fa-location-dot text-primary mr-2" />
                  Ubicacion en campus
                </h3>
                <p className="text-sm text-text-muted">
                  Edificio <span className="font-semibold text-text">{data.edificio_id}</span>
                  {data.zona_id && <> — <span className="capitalize">{data.zona_id.replace(/_/g, ' ')}</span></>}
                </p>
              </div>
            )}

            {/* Miembro desde */}
            <div className="card p-4 text-center">
              <p className="text-xs text-text-subtle">Miembro desde</p>
              <p className="font-semibold text-text text-sm">{formatDate(data.creado_en)}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <i className="fa-solid fa-shield-check text-cucei-green text-xs" />
                <span className="text-xs text-cucei-green font-medium">Verificado CUCEI MART</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal resena */}
      {showModal && (
        <ModalResena
          emprendedor={data}
          onClose={() => setShowModal(false)}
          onSuccess={cargar}
        />
      )}
    </div>
  );
}
