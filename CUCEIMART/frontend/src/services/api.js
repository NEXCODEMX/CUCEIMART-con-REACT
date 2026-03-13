// src/services/api.js
// CUCEI MART - Capa de servicios API | NEXCODE

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Inyectar token en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cuceimart_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Manejo global de errores
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cuceimart_token');
      localStorage.removeItem('cuceimart_user');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(err);
  }
);

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const authAPI = {
  loginCliente:        (data) => api.post('/auth/login/cliente', data),
  loginEmprendedor:    (data) => api.post('/auth/login/emprendedor', data),
  registrarCliente:    (data) => api.post('/auth/registro/cliente', data),
  registrarEmprendedor:(data) => api.post('/auth/registro/emprendedor', data),
  verificarToken:      ()     => api.get('/auth/verificar'),
};

// ─── EMPRENDEDORES ───────────────────────────────────────────────────────────
export const emprendedoresAPI = {
  listar:      (params) => api.get('/emprendedores', { params }),
  destacados:  ()       => api.get('/emprendedores/destacados'),
  obtener:     (slug)   => api.get(`/emprendedores/${slug}`),
  crearResena: (id, data) => api.post(`/emprendedores/${id}/resenas`, data),
};

// ─── PRODUCTOS ───────────────────────────────────────────────────────────────
export const productosAPI = {
  listar:  (params) => api.get('/productos', { params }),
  miPanel: {
    listar: ()     => api.get('/emprendedor/productos'),
    crear:  (data) => api.post('/emprendedor/productos', data),
    perfil: ()     => api.get('/emprendedor/perfil'),
  },
};

export default api;
