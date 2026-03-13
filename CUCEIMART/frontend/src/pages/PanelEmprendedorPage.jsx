// src/pages/PanelEmprendedorPage.jsx
// CUCEI MART — Panel del emprendedor | NEXCODE

import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productosAPI } from '../services/api';
import { StarDisplay } from '../components/StarRating';
import { formatPrice, formatDate, getCategoryLabel } from '../utils/helpers';
import toast from 'react-hot-toast';

// ─── MODAL NUEVO PRODUCTO ─────────────────────────────────────────────────────
const ModalProducto = ({ onClose, onSuccess }) => {
  const [form,    setForm]    = useState({ nombre: '', descripcion_corta: '', precio: '', categoria_principal: '', precio_texto: '' });
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.precio || !form.categoria_principal) {
      toast.error('Nombre, precio y categoria son obligatorios');
      return;
    }
    setLoading(true);
    try {
      await productosAPI.miPanel.crear({
        ...form,
        precio: parseFloat(form.precio),
      });
      toast.success('Producto creado exitosamente');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear el producto');
    } finally {
      setLoading(false);
    }
  };

  const CATS = [
    'comida','ropa','accesorios','cosmeticos','decoraciones',
    'mascotas','tecnologia','videojuegos','libros','suplementos',
    'regalos','educacion','servicios','papeleria','electronica',
    'muebles','articulos_de_cocina','juguetes','otros',
  ];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex items-center justify-between p-5 border-b border-surface-dark">
          <h3 className="font-heading font-bold text-lg text-text">Nuevo producto</h3>
          <button onClick={onClose} className="btn-icon w-8 h-8 rounded-lg text-sm">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="input-label">Nombre <span className="text-accent">*</span></label>
            <input value={form.nombre} onChange={e => update('nombre', e.target.value)} placeholder="Nombre del producto" className="input-field" required />
          </div>
          <div>
            <label className="input-label">Descripcion corta</label>
            <textarea value={form.descripcion_corta} onChange={e => update('descripcion_corta', e.target.value)} placeholder="Descripcion breve..." rows={2} className="input-field resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Precio (MXN) <span className="text-accent">*</span></label>
              <input type="number" min="0" step="0.01" value={form.precio} onChange={e => update('precio', e.target.value)} placeholder="0.00" className="input-field" required />
            </div>
            <div>
              <label className="input-label">Texto de precio</label>
              <input value={form.precio_texto} onChange={e => update('precio_texto', e.target.value)} placeholder="Desde $50 MXN" className="input-field" />
            </div>
          </div>
          <div>
            <label className="input-label">Categoria <span className="text-accent">*</span></label>
            <select value={form.categoria_principal} onChange={e => update('categoria_principal', e.target.value)} className="input-field" required>
              <option value="">Selecciona...</option>
              {CATS.map(c => <option key={c} value={c}>{getCategoryLabel(c)}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Guardando...</> : <><i className="fa-solid fa-plus" /> Crear producto</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color = '#0052CC' }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
      style={{ backgroundColor: `${color}15` }}>
      <i className={`fa-solid ${icon} text-xl`} style={{ color }} />
    </div>
    <div>
      <p className="text-2xl font-heading font-bold text-text">{value}</p>
      <p className="text-sm text-text-muted">{label}</p>
      {sub && <p className="text-xs text-text-subtle mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function PanelEmprendedorPage() {
  const { user, isEmprendedor, loading: authLoading } = useAuth();
  const [perfil,     setPerfil]     = useState(null);
  const [productos,  setProductos]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);

  if (!authLoading && !isEmprendedor) return <Navigate to="/login" replace />;

  const cargar = async () => {
    setLoading(true);
    try {
      const [perfilRes, prodRes] = await Promise.allSettled([
        productosAPI.miPanel.perfil(),
        productosAPI.miPanel.listar(),
      ]);
      if (perfilRes.status === 'fulfilled') setPerfil(perfilRes.value.data.data);
      if (prodRes.status   === 'fulfilled') setProductos(prodRes.value.data.data || []);
    } catch (err) {
      toast.error('Error cargando el panel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isEmprendedor) cargar(); }, [isEmprendedor]);

  const emp = perfil || user;

  return (
    <div className="pt-16 min-h-screen bg-surface">

      {/* Header */}
      <div className="bg-white border-b border-surface-dark">
        <div className="page-container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading font-bold text-2xl text-text">
                Panel de emprendedor
              </h1>
              <p className="text-text-muted text-sm mt-0.5">
                <i className="fa-solid fa-store mr-1.5 text-primary" />
                {emp?.nombre_negocio || 'Mi negocio'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {emp?.slug_negocio && (
                <Link to={`/emprendedores/${emp.slug_negocio}`} className="btn-secondary text-sm py-2 px-4" target="_blank">
                  <i className="fa-solid fa-eye text-xs" />
                  Ver mi perfil
                </Link>
              )}
              <button onClick={() => setShowModal(true)} className="btn-primary text-sm py-2 px-4">
                <i className="fa-solid fa-plus text-xs" />
                Nuevo producto
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container py-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="fa-box"         label="Productos"      value={emp?.total_productos || 0}                        color="#0052CC" />
          <StatCard icon="fa-star"        label="Calificacion"   value={parseFloat(emp?.reputacion_promedio || 0).toFixed(1)} sub="/ 5.0 estrellas" color="#FFAB00" />
          <StatCard icon="fa-comments"    label="Resenas"        value={emp?.total_resenas || 0}                          color="#00875A" />
          <StatCard icon="fa-medal"       label="Membresia"      value={emp?.nivel_membresia || 'basico'}                 color="#FF5630" />
        </div>

        {/* Informacion del negocio */}
        {perfil && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading font-bold text-lg text-text">Informacion del negocio</h2>
              <span className={`badge ${perfil.estado === 'activa' ? 'badge-green' : 'badge-gray'}`}>
                <i className={`fa-solid ${perfil.estado === 'activa' ? 'fa-circle-check' : 'fa-circle-xmark'} text-[10px]`} />
                {perfil.estado}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-sm">
              {[
                { label: 'Nombre del negocio',   value: perfil.nombre_negocio },
                { label: 'Categoria principal',  value: getCategoryLabel(perfil.categoria_principal) },
                { label: 'Correo de contacto',   value: perfil.correo_contacto },
                { label: 'WhatsApp',             value: perfil.whatsapp || '—' },
                { label: 'Instagram',            value: perfil.instagram || '—' },
                { label: 'Verificacion',         value: perfil.num_verificacion || '—' },
                { label: 'Miembro desde',        value: formatDate(perfil.creado_en) },
                { label: 'Precio minimo',        value: perfil.precio_minimo !== null ? formatPrice(perfil.precio_minimo) : '—' },
                { label: 'Estado verificacion',  value: perfil.estado_verificacion },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-text-subtle mb-0.5">{label}</p>
                  <p className="font-medium text-text truncate">{value}</p>
                </div>
              ))}
            </div>

            {perfil.descripcion_corta && (
              <div className="mt-4 pt-4 border-t border-surface-dark">
                <p className="text-xs text-text-subtle mb-1">Descripcion</p>
                <p className="text-sm text-text-muted">{perfil.descripcion_corta}</p>
              </div>
            )}
          </div>
        )}

        {/* Mis productos */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-bold text-lg text-text">
              Mis productos
              <span className="ml-2 badge-primary text-xs">
                {productos.length}
              </span>
            </h2>
            <button onClick={() => setShowModal(true)} className="btn-secondary text-sm py-2 px-3">
              <i className="fa-solid fa-plus text-xs" />
              Agregar
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : productos.length === 0 ? (
            <div className="text-center py-12">
              <i className="fa-solid fa-box-open text-4xl text-surface-dark mb-3 block" />
              <p className="text-text-muted mb-4">No tienes productos publicados aun.</p>
              <button onClick={() => setShowModal(true)} className="btn-primary">
                <i className="fa-solid fa-plus" />
                Agregar primer producto
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-dark text-left">
                    {['Producto','Categoria','Precio','Estado','Destacado','Calificacion'].map(h => (
                      <th key={h} className="pb-3 pr-4 text-xs font-semibold text-text-muted uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface">
                  {productos.map(p => (
                    <tr key={p.id_producto} className="hover:bg-surface/50 transition-colors">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-text truncate max-w-[180px]">{p.nombre}</p>
                        {p.descripcion_corta && (
                          <p className="text-xs text-text-subtle truncate max-w-[180px]">{p.descripcion_corta}</p>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="badge-gray capitalize">{getCategoryLabel(p.categoria_principal)}</span>
                      </td>
                      <td className="py-3 pr-4 font-semibold text-primary whitespace-nowrap">
                        {p.precio_texto || (p.precio === 0 ? 'Gratis' : formatPrice(p.precio))}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`badge ${p.estado === 'activo' ? 'badge-green' : p.estado === 'agotado' ? 'badge-accent' : 'badge-gray'}`}>
                          {p.estado}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {p.es_destacado
                          ? <i className="fa-solid fa-fire text-accent" />
                          : <i className="fa-regular fa-circle text-surface-dark" />}
                      </td>
                      <td className="py-3">
                        <StarDisplay rating={parseFloat(p.calificacion_prom) || 0} total={p.total_resenas} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Nota IA */}
        <div className="card p-5 border-l-4 border-l-primary">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 gradient-cucei rounded-xl flex items-center justify-center shrink-0 shadow-card">
              <i className="fa-solid fa-robot text-white text-sm" />
            </div>
            <div>
              <h3 className="font-semibold text-text mb-1">Asistente IA — Proximamente</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Pronto tendras acceso a estadisticas avanzadas, recomendaciones personalizadas para tu negocio
                y un chatbot de IA que respondera las preguntas de tus clientes automaticamente.
                Desarrollado por <span className="font-semibold text-primary">NEXCODE</span>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <ModalProducto
          onClose={() => setShowModal(false)}
          onSuccess={cargar}
        />
      )}
    </div>
  );
}
