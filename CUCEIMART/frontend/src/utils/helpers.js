// src/utils/helpers.js
// CUCEI MART - Utilidades | NEXCODE

export const CATEGORIAS = [
  { value: 'todos',              label: 'Todos',           icon: 'fa-th-large' },
  { value: 'comida',             label: 'Alimentos',       icon: 'fa-utensils' },
  { value: 'ropa',               label: 'Ropa',            icon: 'fa-shirt' },
  { value: 'accesorios',         label: 'Accesorios',      icon: 'fa-gem' },
  { value: 'cosmeticos',         label: 'Cosmeticos',      icon: 'fa-star' },
  { value: 'decoraciones',       label: 'Decoraciones',    icon: 'fa-palette' },
  { value: 'mascotas',           label: 'Mascotas',        icon: 'fa-paw' },
  { value: 'tecnologia',         label: 'Tecnologia',      icon: 'fa-laptop' },
  { value: 'videojuegos',        label: 'Videojuegos',     icon: 'fa-gamepad' },
  { value: 'libros',             label: 'Libros',          icon: 'fa-book' },
  { value: 'suplementos',        label: 'Suplementos',     icon: 'fa-capsules' },
  { value: 'regalos',            label: 'Regalos',         icon: 'fa-gift' },
  { value: 'educacion',          label: 'Educacion',       icon: 'fa-graduation-cap' },
  { value: 'servicios',          label: 'Servicios',       icon: 'fa-tools' },
  { value: 'papeleria',          label: 'Papeleria',       icon: 'fa-pen-ruler' },
  { value: 'electronica',        label: 'Electronica',     icon: 'fa-microchip' },
  { value: 'muebles',            label: 'Muebles',         icon: 'fa-couch' },
  { value: 'articulos_de_cocina',label: 'Cocina',          icon: 'fa-kitchen-set' },
  { value: 'juguetes',           label: 'Juguetes',        icon: 'fa-puzzle-piece' },
  { value: 'vapes',              label: 'Vapes',           icon: 'fa-smoking' },
  { value: 'otros',              label: 'Otros',           icon: 'fa-ellipsis' },
];

export const MEMBRESIA_CONFIG = {
  destacado: { label: 'Destacado', color: 'membresia-destacado', icon: 'fa-crown' },
  premium:   { label: 'Premium',   color: 'membresia-premium',   icon: 'fa-gem' },
  estandar:  { label: 'Estandar',  color: 'membresia-estandar',  icon: 'fa-medal' },
  basico:    { label: 'Basico',    color: 'membresia-basico',     icon: 'fa-store' },
};

export const formatPrice = (price) => {
  if (price === null || price === undefined) return 'Consultar';
  if (price === 0) return 'Gratis';
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(dateStr));
};

export const getCategoryLabel = (value) => {
  const cat = CATEGORIAS.find(c => c.value === value);
  return cat ? cat.label : value;
};

export const getCategoryIcon = (value) => {
  const cat = CATEGORIAS.find(c => c.value === value);
  return cat ? cat.icon : 'fa-tag';
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
};

export const generateAvatarColor = (str) => {
  const colors = [
    '#0052CC','#003380','#2684FF','#FF5630','#FF7452',
    '#FFAB00','#00875A','#006644','#6554C0','#403294',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export const truncate = (str, len = 100) => {
  if (!str) return '';
  return str.length <= len ? str : str.slice(0, len) + '...';
};

export const slugify = (str) =>
  str.toLowerCase()
     .replace(/[^a-z0-9\s-]/g, '')
     .replace(/\s+/g, '-')
     .replace(/-+/g, '-')
     .trim();
