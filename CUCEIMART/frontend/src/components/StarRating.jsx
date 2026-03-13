// src/components/StarRating.jsx
// CUCEI MART — Componente de calificacion con estrellas | NEXCODE

import { useState } from 'react';

export const StarDisplay = ({ rating = 0, total = 0, size = 'sm', showCount = true }) => {
  const stars = [1, 2, 3, 4, 5];
  const sizeClass = size === 'lg' ? 'text-xl' : size === 'md' ? 'text-base' : 'text-sm';

  return (
    <div className="flex items-center gap-1.5">
      <div className={`flex items-center gap-0.5 ${sizeClass}`}>
        {stars.map((s) => {
          const filled  = rating >= s;
          const partial = !filled && rating > s - 1;
          return (
            <span key={s} className="relative inline-block leading-none">
              <i className="fa-regular fa-star text-surface-dark" />
              {(filled || partial) && (
                <span
                  className="absolute inset-0 overflow-hidden text-gold"
                  style={{ width: filled ? '100%' : `${(rating - (s - 1)) * 100}%` }}
                >
                  <i className="fa-solid fa-star" />
                </span>
              )}
            </span>
          );
        })}
      </div>
      {showCount && (
        <span className="text-xs text-text-muted font-medium">
          {rating > 0 ? rating.toFixed(1) : '—'}
          {total > 0 && <span className="ml-1 text-text-subtle">({total})</span>}
        </span>
      )}
    </div>
  );
};

export const StarInput = ({ value = 0, onChange, disabled = false }) => {
  const [hover, setHover] = useState(0);
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Calificacion">
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onChange(s)}
          onMouseEnter={() => !disabled && setHover(s)}
          onMouseLeave={() => !disabled && setHover(0)}
          className={`text-3xl transition-all duration-150 outline-none
            ${disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
            ${(hover || value) >= s ? 'text-gold' : 'text-surface-dark'}
          `}
          aria-label={`${s} estrella${s !== 1 ? 's' : ''}`}
        >
          <i className={`fa-${(hover || value) >= s ? 'solid' : 'regular'} fa-star`} />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm font-semibold text-gold">
          {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][value]}
        </span>
      )}
    </div>
  );
};
