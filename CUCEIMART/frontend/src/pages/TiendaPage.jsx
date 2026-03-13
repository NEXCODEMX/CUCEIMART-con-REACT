// src/pages/TiendaPage.jsx
// CUCEI MART — Pagina de tienda/buscador | NEXCODE

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { emprendedoresAPI } from '../services/api';
import EmprendedorCard from '../components/EmprendedorCard';
import { CATEGORIAS } from '../utils/helpers';

const ORDENES = [
  { value: 'reputacion', label: 'Mejor calificados' },
  { value: 'recientes',  label: 'Mas recientes'     },
  { value: 'nombre',     label: 'Nombre A-Z'        },
  { value: 'productos',  label: 'Mas productos'     },
];

export default function TiendaPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [busqueda,     setBusqueda]     = useState(searchParams.get('q') || '');
  const [categoria,    setCategoria]    = useState(searchParams.get('categoria') || 'todos');
  const [orden,        setOrden]        = useState('reputacion');
  const [data,         setData]         = useState([]);
  const [total,        setTotal]        = useState(0);
  const [pagina,       setPagina]       = useState(1);
  const [loading,      setLoading]      = useState(false);
  const [inputVal,     setInputVal]     = useState(searchParams.get('q') || '');

  const LIMITE = 12;

  const cargar = useCallback(async (pag = 1) => {
    setLoading(true);
    try {
      const params = { orden, pagina: pag, limite: LIMITE };
      if (busqueda.trim()) params.busqueda = busqueda.trim();
      if (categoria && categoria !== 'todos') params.categoria = categoria;

      const res = await emprendedoresAPI.listar(params);
      const { data: rows, total: tot } = res.data;

      if (pag === 1) {
        setData(rows || []);
      } else {
        setData(prev => [...prev, ...(rows || [])]);
      }
      setTotal(tot || 0);
      setPagina(pag);
    } catch (err) {
      console.error('[Tienda] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [busqueda, categoria, orden]);

  // Busqueda con debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setBusqueda(inputVal);
    }, 400);
    return () => clearTimeout(t);
  }, [inputVal]);

  useEffect(() => {
    cargar(1);
    setSearchParams(prev => {
      if (busqueda) prev.set('q', busqueda); else prev.delete('q');
      if (categoria !== 'todos') prev.set('categoria', categoria); else prev.delete('categoria');
      return prev;
    });
  }, [busqueda, categoria, orden]);

  const handleMasResultados = () => cargar(pagina + 1);

  const hayMas = data.length < total;

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
      <div className="skeleton h-8 w-full rounded-xl" />
    </div>
  );

  return (
    <div className="pt-16 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-surface-dark">
        <div className="page-container py-8">
          <h1 className="font-heading font-bold text-3xl text-text mb-1">Tienda CUCEI MART</h1>
          <p className="text-text-muted text-sm">
            {total > 0 ? `${total} emprendimiento${total !== 1 ? 's' : ''} disponibles` : 'Explora todos los emprendimientos universitarios'}
          </p>
        </div>
      </div>

      <div className="page-container py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar filtros */}
          <aside className="lg:w-64 shrink-0">
            <div className="card p-5 sticky top-20 space-y-5">

              {/* Busqueda */}
              <div>
                <label className="input-label">Buscar</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fa-solid fa-search text-text-subtle text-sm" />
                  </div>
                  <input
                    type="text"
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    placeholder="Nombre o descripcion..."
                    className="input-field pl-9 text-sm py-2.5"
                  />
                  {inputVal && (
                    <button
                      onClick={() => { setInputVal(''); setBusqueda(''); }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-subtle hover:text-text"
                    >
                      <i className="fa-solid fa-xmark text-sm" />
                    </button>
                  )}
                </div>
              </div>

              {/* Ordenar */}
              <div>
                <label className="input-label">Ordenar por</label>
                <select
                  value={orden}
                  onChange={e => setOrden(e.target.value)}
                  className="input-field text-sm py-2.5"
                >
                  {ORDENES.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Categorias */}
              <div>
                <label className="input-label">Categoria</label>
                <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                  {CATEGORIAS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setCategoria(c.value)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 text-left
                        ${categoria === c.value
                          ? 'bg-primary text-white font-semibold'
                          : 'text-text-muted hover:bg-surface hover:text-text'
                        }`}
                    >
                      <i className={`fa-solid ${c.icon} text-xs w-4 text-center`} />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Grid de resultados */}
          <main className="flex-1 min-w-0">

            {/* Tags de filtros activos */}
            {(busqueda || categoria !== 'todos') && (
              <div className="flex flex-wrap gap-2 mb-5">
                {busqueda && (
                  <span className="badge-primary gap-1.5">
                    <i className="fa-solid fa-search text-[10px]" />
                    {busqueda}
                    <button onClick={() => { setInputVal(''); setBusqueda(''); }} className="hover:opacity-70">
                      <i className="fa-solid fa-xmark text-[10px]" />
                    </button>
                  </span>
                )}
                {categoria !== 'todos' && (
                  <span className="badge-primary gap-1.5 capitalize">
                    {categoria}
                    <button onClick={() => setCategoria('todos')} className="hover:opacity-70">
                      <i className="fa-solid fa-xmark text-[10px]" />
                    </button>
                  </span>
                )}
                <button
                  onClick={() => { setInputVal(''); setBusqueda(''); setCategoria('todos'); }}
                  className="text-xs text-accent hover:underline"
                >
                  Limpiar filtros
                </button>
              </div>
            )}

            {/* Resultados header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-text-muted">
                {loading && data.length === 0
                  ? 'Buscando...'
                  : `${data.length} de ${total} resultado${total !== 1 ? 's' : ''}`}
              </p>
            </div>

            {/* Grid */}
            {loading && data.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-20 card">
                <i className="fa-solid fa-face-meh text-5xl text-surface-dark mb-4 block" />
                <h3 className="font-heading font-bold text-xl text-text mb-2">Sin resultados</h3>
                <p className="text-text-muted mb-5">
                  No encontramos emprendimientos con esos criterios.
                </p>
                <button
                  onClick={() => { setInputVal(''); setBusqueda(''); setCategoria('todos'); }}
                  className="btn-primary mx-auto"
                >
                  <i className="fa-solid fa-rotate-left" />
                  Ver todos
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {data.map((emp, i) => (
                    <div key={emp.id_emprendedor} className="animate-fade-up" style={{ animationDelay: `${(i % 6) * 60}ms` }}>
                      <EmprendedorCard emprendedor={emp} />
                    </div>
                  ))}
                </div>

                {/* Cargar mas */}
                {hayMas && (
                  <div className="text-center mt-8">
                    <button
                      onClick={handleMasResultados}
                      disabled={loading}
                      className="btn-secondary px-8 py-3"
                    >
                      {loading
                        ? <><i className="fa-solid fa-spinner fa-spin" /> Cargando...</>
                        : <><i className="fa-solid fa-plus" /> Cargar mas ({total - data.length} restantes)</>
                      }
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
