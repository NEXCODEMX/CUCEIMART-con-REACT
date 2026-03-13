// src/pages/HomePage.jsx
// CUCEI MART — Pagina principal | NEXCODE

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { emprendedoresAPI, productosAPI } from '../services/api';
import EmprendedorCard from '../components/EmprendedorCard';
import { StarDisplay } from '../components/StarRating';
import { CATEGORIAS, formatPrice, getCategoryLabel, getCategoryIcon, getInitials, generateAvatarColor, truncate } from '../utils/helpers';

// ─── HERO ─────────────────────────────────────────────────────────────────────
const Hero = ({ busqueda, setBusqueda }) => (
  <section className="hero-pattern py-16 sm:py-20 lg:py-28 relative overflow-hidden">
    {/* Background shapes */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-10 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/4 rounded-full blur-3xl" />
    </div>

    <div className="page-container relative z-10">
      <div className="max-w-3xl mx-auto text-center">

        {/* Tag */}
        <div className="inline-flex items-center gap-2 bg-primary/8 text-primary rounded-full px-4 py-1.5
                        text-xs font-semibold mb-6 border border-primary/15">
          <i className="fa-solid fa-atom text-xs" />
          Plataforma universitaria CUCEI — NEXCODE
        </div>

        {/* Titulo */}
        <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-text mb-5 leading-tight">
          Tu punto de{' '}
          <span className="text-gradient">emprendimiento</span>
        </h1>
        <p className="text-text-muted text-lg sm:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
          Descubre productos y servicios de emprendedores universitarios.
          Apoya el talento de tu comunidad.
        </p>

        {/* Search */}
        <div className="search-hero max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <i className="fa-solid fa-search text-text-subtle text-base" />
          </div>
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Busca productos, servicios o emprendedores..."
            className="w-full pl-12 pr-4 py-4 bg-transparent text-text placeholder-text-subtle
                       text-base outline-none rounded-2xl font-body"
          />
          <Link
            to={`/tienda${busqueda ? `?q=${encodeURIComponent(busqueda)}` : ''}`}
            className="m-2 btn-primary shrink-0 py-3 px-5 text-sm"
          >
            <i className="fa-solid fa-arrow-right" />
            Buscar
          </Link>
        </div>

        {/* Quick stats */}
        <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
          {[
            { icon: 'fa-store',   label: '50+ negocios',    color: 'text-primary' },
            { icon: 'fa-box',     label: '200+ productos',  color: 'text-accent' },
            { icon: 'fa-star',    label: 'Rating 4.8',      color: 'text-gold' },
            { icon: 'fa-shield-check', label: 'Verificados', color: 'text-cucei-green' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5 text-sm text-text-muted">
              <i className={`fa-solid ${s.icon} ${s.color} text-xs`} />
              {s.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

// ─── BANNER DESTACADOS ────────────────────────────────────────────────────────
const BannerDestacados = ({ destacados }) => {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (destacados.length < 2) return;
    const t = setInterval(() => setActiveIdx(i => (i + 1) % destacados.length), 4000);
    return () => clearInterval(t);
  }, [destacados.length]);

  if (!destacados.length) return null;
  const active = destacados[activeIdx];
  const avatarBg = generateAvatarColor(active.nombre_negocio || '');

  return (
    <section className="page-container py-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="section-title flex items-center gap-2">
          <i className="fa-solid fa-crown text-gold text-xl" />
          Emprendedores Destacados
        </h2>
        <Link to="/emprendedores?destacados=true" className="btn-ghost text-sm">
          Ver todos <i className="fa-solid fa-arrow-right text-xs ml-1" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Main featured */}
        <div className="lg:col-span-2">
          <Link
            to={`/emprendedores/${active.slug_negocio}`}
            className="block relative gradient-cucei rounded-xl3 p-7 overflow-hidden
                       hover:shadow-hover transition-all duration-300 group min-h-[220px]"
          >
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-12 translate-x-12" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-8 -translate-x-8" />

            <div className="relative z-10">
              <div className="flex items-start gap-4 mb-5">
                <div
                  className="w-16 h-16 rounded-xl2 flex items-center justify-center text-white font-heading font-bold text-2xl
                             border-2 border-white/30 shadow-lg"
                  style={{ backgroundColor: avatarBg }}
                >
                  {getInitials(active.nombre_negocio)}
                </div>
                <div>
                  <div className="badge-gold mb-1">
                    <i className="fa-solid fa-crown text-[10px]" /> Destacado
                  </div>
                  <h3 className="font-heading font-bold text-xl text-white leading-tight">
                    {active.nombre_negocio}
                  </h3>
                  <p className="text-white/70 text-sm capitalize">
                    {getCategoryLabel(active.categoria_principal)}
                  </p>
                </div>
              </div>

              <p className="text-white/80 text-sm leading-relaxed mb-4">
                {active.titulo_promocional || active.descripcion_promo || truncate(active.descripcion_corta, 100)}
              </p>

              <div className="flex items-center justify-between">
                <StarDisplay rating={parseFloat(active.reputacion_promedio) || 0} total={active.total_resenas} />
                <div className="flex items-center gap-1.5 text-white bg-white/15 px-3 py-1.5 rounded-full text-xs font-semibold
                               group-hover:bg-white/25 transition-colors">
                  Ver negocio
                  <i className="fa-solid fa-arrow-right text-[10px]" />
                </div>
              </div>
            </div>
          </Link>

          {/* Dots */}
          {destacados.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-3">
              {destacados.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIdx ? 'w-6 bg-primary' : 'w-1.5 bg-surface-dark'}`}
                  aria-label={`Diapositiva ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Side list */}
        <div className="flex flex-col gap-3">
          {destacados.slice(0, 3).map((d, i) => {
            const bg = generateAvatarColor(d.nombre_negocio || '');
            return (
              <Link
                key={d.id_emprendedor}
                to={`/emprendedores/${d.slug_negocio}`}
                onClick={() => setActiveIdx(i)}
                className={`card flex items-center gap-3 p-3.5 hover:shadow-hover transition-all duration-200
                  ${i === activeIdx ? 'border-primary ring-1 ring-primary/20' : ''}`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: bg }}
                >
                  {getInitials(d.nombre_negocio)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text truncate">{d.nombre_negocio}</p>
                  <StarDisplay rating={parseFloat(d.reputacion_promedio) || 0} total={d.total_resenas} />
                </div>
                {i === activeIdx && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                )}
              </Link>
            );
          })}

          <Link to="/emprendedores" className="btn-secondary text-sm justify-center py-2.5">
            <i className="fa-solid fa-store text-xs" />
            Todos los negocios
          </Link>
        </div>
      </div>
    </section>
  );
};

// ─── CATEGORIAS ───────────────────────────────────────────────────────────────
const CategoriaGrid = () => {
  const cats = CATEGORIAS.filter(c => c.value !== 'todos').slice(0, 12);
  return (
    <section className="bg-white border-y border-surface-dark py-10">
      <div className="page-container">
        <h2 className="section-title mb-6">
          Explorar por categoria
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
          {cats.map(c => (
            <Link
              key={c.value}
              to={`/tienda?categoria=${c.value}`}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-surface-dark bg-surface
                         hover:border-primary hover:bg-primary/5 hover:shadow-card transition-all duration-200 group text-center"
            >
              <div className="w-9 h-9 rounded-xl bg-white border border-surface-dark flex items-center justify-center
                              group-hover:bg-primary group-hover:border-primary transition-all duration-200 shadow-sm">
                <i className={`fa-solid ${c.icon} text-text-muted group-hover:text-white text-sm transition-colors`} />
              </div>
              <span className="text-[11px] font-medium text-text-muted group-hover:text-primary transition-colors leading-tight">
                {c.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── PRODUCTOS DESTACADOS ─────────────────────────────────────────────────────
const ProductosMiniCard = ({ producto }) => {
  const { nombre, precio, precio_texto, categoria_principal, nombre_negocio, slug_negocio, calificacion_prom, total_resenas, es_destacado } = producto;
  return (
    <Link
      to={`/emprendedores/${slug_negocio}`}
      className="card-hover flex items-center gap-3 p-3"
    >
      {/* Placeholder imagen */}
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-surface to-surface-dark flex items-center justify-center shrink-0 border border-surface-dark">
        <i className={`fa-solid ${getCategoryIcon(categoria_principal)} text-text-subtle text-lg`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text leading-tight truncate">{nombre}</p>
        <p className="text-xs text-text-muted truncate">{nombre_negocio}</p>
        <div className="flex items-center gap-2 mt-1">
          <StarDisplay rating={parseFloat(calificacion_prom) || 0} total={total_resenas} />
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-primary">
          {precio_texto || (precio === 0 ? 'Gratis' : formatPrice(precio))}
        </p>
        {es_destacado && (
          <span className="text-[10px] text-gold font-semibold">
            <i className="fa-solid fa-fire mr-0.5" />Destacado
          </span>
        )}
      </div>
    </Link>
  );
};

// ─── COMO FUNCIONA ────────────────────────────────────────────────────────────
const ComoFunciona = () => {
  const pasos = [
    { icon: 'fa-search',        title: 'Descubre',  desc: 'Explora cientos de productos y servicios de emprendedores universitarios.', color: '#0052CC' },
    { icon: 'fa-store',         title: 'Contacta',  desc: 'Conecta directo con el emprendedor por WhatsApp o sus redes sociales.',   color: '#FF5630' },
    { icon: 'fa-star',          title: 'Califica',  desc: 'Deja tu resena y ayuda a otros estudiantes a elegir lo mejor.',           color: '#FFAB00' },
    { icon: 'fa-rocket',        title: 'Emprende',  desc: 'Registra tu negocio y llega a toda la comunidad CUCEI.',                  color: '#00875A' },
  ];

  return (
    <section className="page-container py-14">
      <div className="text-center mb-10">
        <h2 className="section-title mb-2">Como funciona</h2>
        <p className="text-text-muted">Simple, rapido y efectivo para toda la comunidad universitaria</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {pasos.map((p, i) => (
          <div key={p.title} className="card p-6 text-center group hover:shadow-hover transition-all duration-300">
            <div
              className="w-14 h-14 rounded-xl2 flex items-center justify-center mx-auto mb-4 shadow-card
                         group-hover:scale-110 transition-transform duration-300"
              style={{ backgroundColor: `${p.color}15` }}
            >
              <i className={`fa-solid ${p.icon} text-2xl`} style={{ color: p.color }} />
            </div>
            <div className="w-6 h-6 rounded-full bg-surface-dark flex items-center justify-center mx-auto mb-3 text-xs font-bold text-text-muted">
              {i + 1}
            </div>
            <h3 className="font-heading font-bold text-text mb-2">{p.title}</h3>
            <p className="text-sm text-text-muted leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

// ─── CTA ─────────────────────────────────────────────────────────────────────
const CTASection = () => (
  <section className="gradient-cucei mx-4 sm:mx-6 lg:mx-8 rounded-xl3 mb-10 overflow-hidden relative">
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-0 right-0 w-80 h-80 bg-white rounded-full -translate-y-32 translate-x-32" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-white rounded-full translate-y-20 -translate-x-20" />
    </div>
    <div className="relative z-10 text-center py-14 px-6">
      <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white mb-3">
        Listo para emprender?
      </h2>
      <p className="text-white/75 text-lg mb-8 max-w-md mx-auto">
        Registra tu negocio y conecta con toda la comunidad CUCEI hoy mismo.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link to="/registro?tipo=emprendedor" className="btn-accent px-7 py-3.5">
          <i className="fa-solid fa-rocket" />
          Registrar mi negocio
        </Link>
        <Link to="/tienda" className="btn-secondary px-7 py-3.5 !text-white !border-white/50 hover:!bg-white/15">
          <i className="fa-solid fa-store" />
          Explorar tienda
        </Link>
      </div>
    </div>
  </section>
);

// ─── FOOTER ───────────────────────────────────────────────────────────────────
const Footer = () => (
  <footer className="bg-white border-t border-surface-dark py-10">
    <div className="page-container">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 gradient-cucei rounded-lg flex items-center justify-center">
              <i className="fa-solid fa-atom text-white text-xs" />
            </div>
            <span className="font-heading font-bold text-text">
              CUCEI<span className="text-primary"> MART</span>
            </span>
          </div>
          <p className="text-sm text-text-muted leading-relaxed mb-4">
            Plataforma de emprendimiento universitario del Centro Universitario de Ciencias Exactas e Ingenierias.
          </p>
          <div className="flex gap-2">
            {[
              { icon: 'fa-instagram', href: 'https://www.instagram.com/NexCode_MX/', label: 'Instagram' },
              { icon: 'fa-github',    href: 'https://github.com/NEXCODEMX',         label: 'GitHub' },
              { icon: 'fa-youtube',   href: 'https://www.youtube.com/@NexCodeMX',   label: 'YouTube' },
            ].map(s => (
              <a key={s.icon} href={s.href} target="_blank" rel="noopener noreferrer"
                className="btn-icon w-8 h-8 rounded-lg text-xs"
                aria-label={s.label}>
                <i className={`fa-brands ${s.icon}`} />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-heading font-semibold text-text mb-3 text-sm">Plataforma</h4>
          <nav className="space-y-2">
            {[['/', 'Inicio'], ['/tienda', 'Tienda'], ['/emprendedores', 'Emprendedores'], ['/registro?tipo=emprendedor', 'Emprender']].map(([href, label]) => (
              <Link key={label} to={href} className="block text-sm text-text-muted hover:text-primary transition-colors">{label}</Link>
            ))}
          </nav>
        </div>
        <div>
          <h4 className="font-heading font-semibold text-text mb-3 text-sm">Cuenta</h4>
          <nav className="space-y-2">
            {[['/login', 'Iniciar sesion'], ['/registro', 'Registrarse'], ['/panel', 'Panel emprendedor']].map(([href, label]) => (
              <Link key={label} to={href} className="block text-sm text-text-muted hover:text-primary transition-colors">{label}</Link>
            ))}
          </nav>
        </div>
        <div>
          <h4 className="font-heading font-semibold text-text mb-3 text-sm">NEXCODE</h4>
          <p className="text-sm text-text-muted leading-relaxed mb-3">
            Desarrollado con dedicacion por el equipo NEXCODE. Somos especialistas en tecnologia y emprendimiento universitario.
          </p>
          <a href="https://nexcodemx.github.io/NEXCODE/" target="_blank" rel="noopener noreferrer"
            className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1">
            Conoce NEXCODE
            <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" />
          </a>
        </div>
      </div>
      <div className="border-t border-surface-dark pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-text-subtle">
          2025 CUCEI MART — Todos los derechos reservados.
        </p>
        <p className="text-xs text-text-subtle">
          Desarrollado por{' '}
          <a href="https://nexcodemx.github.io/NEXCODE/" target="_blank" rel="noopener noreferrer"
            className="text-primary font-medium hover:underline">NEXCODE</a>
          {' '}— CUCEI, UDG
        </p>
      </div>
    </div>
  </footer>
);

// ─── MAIN HOME PAGE ───────────────────────────────────────────────────────────
export default function HomePage() {
  const [busqueda,    setBusqueda]    = useState('');
  const [destacados,  setDestacados]  = useState([]);
  const [emprendedores, setEmprendedores] = useState([]);
  const [productos,   setProductos]   = useState([]);
  const [loading,     setLoading]     = useState(true);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [destRes, empRes, prodRes] = await Promise.allSettled([
        emprendedoresAPI.destacados(),
        emprendedoresAPI.listar({ orden: 'reputacion', limite: 6 }),
        productosAPI.listar({ orden: 'destacados', limite: 8 }),
      ]);

      if (destRes.status === 'fulfilled') setDestacados(destRes.value.data.data || []);
      if (empRes.status === 'fulfilled')  setEmprendedores(empRes.value.data.data || []);
      if (prodRes.status === 'fulfilled') setProductos(prodRes.value.data.data || []);
    } catch (err) {
      console.error('[Home] Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const SkeletonCard = () => (
    <div className="card p-5 space-y-3">
      <div className="flex gap-3">
        <div className="skeleton w-14 h-14 rounded-xl2" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
        </div>
      </div>
      <div className="skeleton h-3 w-full rounded" />
      <div className="skeleton h-3 w-2/3 rounded" />
    </div>
  );

  return (
    <div className="pt-16">
      <Hero busqueda={busqueda} setBusqueda={setBusqueda} />
      <BannerDestacados destacados={destacados} />
      <CategoriaGrid />

      {/* Emprendedores mejor calificados */}
      <section className="page-container py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="section-title">
              <i className="fa-solid fa-ranking-star text-gold mr-2" />
              Mejor calificados
            </h2>
            <p className="text-text-muted text-sm mt-0.5">Los favoritos de la comunidad CUCEI</p>
          </div>
          <Link to="/emprendedores" className="btn-ghost text-sm">
            Ver todos <i className="fa-solid fa-arrow-right text-xs ml-1" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : emprendedores.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {emprendedores.map((emp, i) => (
              <div key={emp.id_emprendedor} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                <EmprendedorCard emprendedor={emp} rank={i + 1} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-text-muted">
            <i className="fa-solid fa-store text-4xl mb-3 block text-surface-dark" />
            <p>No hay emprendedores disponibles aun.</p>
            <p className="text-sm mt-1">Configura tu base de datos con el DDL adjunto.</p>
          </div>
        )}
      </section>

      {/* Productos */}
      {productos.length > 0 && (
        <section className="bg-white border-y border-surface-dark py-12">
          <div className="page-container">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title">
                <i className="fa-solid fa-fire text-accent mr-2" />
                Productos destacados
              </h2>
              <Link to="/tienda" className="btn-ghost text-sm">
                Ver tienda <i className="fa-solid fa-arrow-right text-xs ml-1" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {productos.map((p) => (
                <ProductosMiniCard key={p.id_producto} producto={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <ComoFunciona />
      <CTASection />
      <Footer />
    </div>
  );
}
