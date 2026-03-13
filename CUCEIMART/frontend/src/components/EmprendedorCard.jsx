// src/components/EmprendedorCard.jsx
// CUCEI MART — Tarjeta de emprendedor | NEXCODE

import { Link } from 'react-router-dom';
import { StarDisplay } from './StarRating';
import {
  formatPrice, getCategoryLabel, getCategoryIcon,
  getInitials, generateAvatarColor, MEMBRESIA_CONFIG, truncate,
} from '../utils/helpers';

export default function EmprendedorCard({ emprendedor, rank }) {
  const {
    nombre_negocio, slug_negocio, descripcion_corta,
    categoria_principal, reputacion_promedio, total_resenas,
    total_productos, nivel_membresia, es_destacado,
    precio_minimo, precio_maximo, precio_texto,
    whatsapp, instagram,
  } = emprendedor;

  const avatarBg  = generateAvatarColor(nombre_negocio || '');
  const memConfig = MEMBRESIA_CONFIG[nivel_membresia] || MEMBRESIA_CONFIG.basico;
  const rankColors = ['#FFAB00','#97A0AF','#FF7452','#2684FF','#00875A'];

  return (
    <Link
      to={`/emprendedores/${slug_negocio}`}
      className="card-hover flex flex-col group relative overflow-hidden"
    >
      {/* Rank badge */}
      {rank && rank <= 5 && (
        <div
          className="emp-rank-badge"
          style={{ backgroundColor: rankColors[rank - 1] }}
          title={`Top ${rank}`}
        >
          {rank === 1 ? <i className="fa-solid fa-crown text-[10px]" /> : `#${rank}`}
        </div>
      )}

      {/* Destacado ribbon */}
      {es_destacado && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold via-gold-light to-gold-dark" />
      )}

      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className="w-14 h-14 rounded-xl2 flex items-center justify-center text-white font-heading font-bold text-lg shadow-card shrink-0
                       group-hover:shadow-hover transition-all duration-300"
            style={{ backgroundColor: avatarBg }}
          >
            {getInitials(nombre_negocio)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-heading font-bold text-text leading-tight text-sm sm:text-base truncate group-hover:text-primary transition-colors">
                {nombre_negocio}
              </h3>
              <span className={`${memConfig.color} shrink-0`}>
                <i className={`fa-solid ${memConfig.icon} mr-1`} />
                {memConfig.label}
              </span>
            </div>

            {/* Categoria */}
            <div className="flex items-center gap-1 mt-1">
              <i className={`fa-solid ${getCategoryIcon(categoria_principal)} text-text-subtle text-xs`} />
              <span className="text-xs text-text-muted capitalize">
                {getCategoryLabel(categoria_principal)}
              </span>
            </div>
          </div>
        </div>

        {/* Descripcion */}
        <p className="text-sm text-text-muted mt-3 leading-relaxed line-clamp-2">
          {truncate(descripcion_corta, 90) || 'Emprendimiento universitario CUCEI'}
        </p>
      </div>

      {/* Stats */}
      <div className="px-5 py-3 border-t border-surface bg-surface/50 flex items-center justify-between">
        <StarDisplay rating={parseFloat(reputacion_promedio) || 0} total={total_resenas} />
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span>
            <i className="fa-solid fa-box mr-1" />
            {total_productos}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 flex items-center justify-between">
        <div className="text-sm">
          {precio_texto ? (
            <span className="font-semibold text-primary">{precio_texto}</span>
          ) : precio_minimo !== null ? (
            <span className="font-semibold text-primary">
              Desde {formatPrice(precio_minimo)}
            </span>
          ) : (
            <span className="text-text-subtle">Consultar precio</span>
          )}
        </div>

        {/* Social quick links */}
        <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-lg bg-green-50 text-green-600 flex items-center justify-center
                         text-xs hover:bg-green-500 hover:text-white transition-all"
              title="WhatsApp"
            >
              <i className="fa-brands fa-whatsapp" />
            </a>
          )}
          {instagram && (
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center
                         text-xs hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500 hover:text-white transition-all"
              title="Instagram"
            >
              <i className="fa-brands fa-instagram" />
            </a>
          )}
        </div>
      </div>
    </Link>
  );
}
