# CUCEI MART — Plataforma de E-Commerce Universitario

Desarrollado por **NEXCODE** | Centro Universitario de Ciencias Exactas e Ingenierias (CUCEI), UDG

---

## Descripcion

CUCEI MART es una plataforma de comercio electronico orientada a la comunidad universitaria del CUCEI. Conecta a estudiantes emprendedores con la comunidad universitaria, facilitando la venta de productos y servicios, la visibilidad de proyectos estudiantiles y la economia colaborativa interna.

---
HAY EVIDENCIA VISUAL DEL PROTOTIPO EN EL APARTADO PROTOTIPOSVISUALES
TAMBIEN HAY UN EJEMPLO DE LA ESTRUCTURA EN GITHUB PAGES 
TAMBIEN HAY UN APARTADO DE DOCUMENTACION TECNICA DEL PROYECTO
## Tecnologias

### Frontend
- React 18 + Vite
- Tailwind CSS
- React Router DOM v6
- Axios
- React Hot Toast
- Font Awesome 6

### Backend
- Node.js + Express
- PostgreSQL (DDL v2.0 incluido)
- JSON Web Tokens (JWT)
- bcryptjs
- Helmet + Express Rate Limit
- Docker

### Base de Datos
- PostgreSQL 14+
postgresql:
- Esquemas: `cuceimart`, `estadisticas`, `media`
- Extensiones: `uuid-ossp`, `pg_trgm`, `unaccent`, `btree_gin`

---

## Estructura del Proyecto

```
CUCEIMART/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── emprendedoresController.js
│   │   │   └── productosController.js
│   │   ├── db/
│   │   │   └── connection.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   └── routes/
│   │       └── index.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EmprendedorCard.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── StarRating.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── EmprendedorDetailPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── PanelEmprendedorPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── TiendaPage.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── cuceimart_DDL_v2.sql
└── README.md
RecursosAdicionales
DDLS para la base de datos
Documentacion tecnica
Prototipos Visuales, Imagenes y pagina github Pages
```

---

## Guia de Despliegue

### Requisitos previos
- Node.js 18 o superior
- PostgreSQL 14 o superior
- npm o yarn

---

### 1. Clonar el repositorio

```bash
git clone https://github.com/NEXCODEMX/cuceimart.git
cd cuceimart
```

---

### 2. Configurar la base de datos

Crear la base de datos en PostgreSQL:

```sql
CREATE DATABASE cuceimart;
```

Ejecutar el DDL completo:

```bash
psql -U postgres -d cuceimart -f cuceimart_DDL_v2.sql
```

Esto creara automaticamente:
- Todos los esquemas y tablas
- Tipos enumerados, funciones y triggers
- Datos de ejemplo (emprendedores, productos, resenas)
- Usuarios de base de datos con permisos diferenciados

---

### 3. Configurar el Backend

```bash
cd backend
npm install
cp .env.example .env
```

Editar `.env` con tus datos reales:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=cuceimart
DB_USER=cuceimart_admin
DB_PASSWORD=TuPasswordSeguro

JWT_SECRET=tu_secreto_muy_largo_y_seguro_aqui

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

El API estara disponible en: `http://localhost:5000/api/v1`

Verificar que funciona:

```bash
curl http://localhost:5000/api/v1/health
```

---

### 4. Configurar el Frontend

```bash
cd frontend
npm install
```

Crear archivo `.env`:

```env
VITE_API_URL=/api/v1
```

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

El frontend estara disponible en: `http://localhost:3000`

---

### 5. Credenciales de prueba

Con los datos de ejemplo del DDL puedes usar:

**Cliente:**
- Usuario: `ana_cucei`
- Contrasena: (configura una con `bcrypt.hash` o usa el hash del DDL de ejemplo)

**Emprendedor:**
- Usuario: `sanza_art`
- Contrasena: (misma nota que arriba)

Para generar un hash de prueba en Node.js:

```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('MiContrasena123', 12);
console.log(hash);
// Actualiza el campo contrasena_hash en la BD con este valor
```

Actualizar en PostgreSQL:

```sql
UPDATE cuceimart.clientes
SET contrasena_hash = '$2b$12$HASH_GENERADO'
WHERE nombre_usuario = 'ana_cucei';
```

---

## Despliegue en Produccion (Render)

### Backend en Render

1. Crear un nuevo **Web Service** en [render.com](https://render.com)
2. Conectar tu repositorio de GitHub
3. Configurar:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. Agregar las variables de entorno (las del archivo `.env`)
5. Para la base de datos, crear un **PostgreSQL** en Render y usar la URL de conexion

### Frontend en Render (o Vercel)

**Render:**
1. Crear **Static Site**
2. **Root Directory:** `frontend`
3. **Build Command:** `npm install && npm run build`
4. **Publish Directory:** `dist`
5. Configurar `VITE_API_URL` apuntando a la URL del backend

**Vercel (alternativa recomendada para el frontend):**
```bash
cd frontend
npx vercel --prod
```

---

## Endpoints principales de la API

| Metodo | Ruta                                       | Descripcion                        | Auth requerida |
|--------|--------------------------------------------|------------------------------------|----------------|
| POST   | `/api/v1/auth/login/cliente`               | Login de alumno                    | No             |
| POST   | `/api/v1/auth/login/emprendedor`           | Login de emprendedor               | No             |
| POST   | `/api/v1/auth/registro/cliente`            | Registro de alumno                 | No             |
| POST   | `/api/v1/auth/registro/emprendedor`        | Registro de emprendedor            | No             |
| GET    | `/api/v1/auth/verificar`                   | Verificar token activo             | Si             |
| GET    | `/api/v1/emprendedores`                    | Listar emprendedores (con filtros) | No             |
| GET    | `/api/v1/emprendedores/destacados`         | Emprendedores del banner           | No             |
| GET    | `/api/v1/emprendedores/:slug`              | Perfil de emprendedor              | No             |
| POST   | `/api/v1/emprendedores/:id/resenas`        | Crear resena                       | Cliente        |
| GET    | `/api/v1/productos`                        | Listar productos (con filtros)     | No             |
| GET    | `/api/v1/emprendedor/perfil`               | Mi perfil de emprendedor           | Emprendedor    |
| GET    | `/api/v1/emprendedor/productos`            | Mis productos                      | Emprendedor    |
| POST   | `/api/v1/emprendedor/productos`            | Crear producto                     | Emprendedor    |

---

## Funcionalidades implementadas

- Login y registro diferenciado para clientes (alumnos) y emprendedores
- Buscador de emprendimientos con filtros por categoria y ordenamiento
- Sistema de calificaciones con estrellas (1-5) y comentarios
- Histograma de distribucion de calificaciones
- Banner de emprendedores destacados con rotacion automatica
- Catalogo de productos por emprendedor
- Panel de emprendedor con gestion de productos
- Sistema de roles y permisos (superadmin, admin, emprendedor, cliente, moderador, observador_ia)
- JWT con refresh tokens y sesiones persistentes
- Rate limiting y proteccion con Helmet
- Triggers automaticos para reputacion y totales
- Vistas SQL optimizadas para consultas frecuentes

---

## Funcionalidades planeadas (proximas versiones)

- Chatbot IA integrado para clientes (respuestas automaticas) y emprendedores (estadisticas)
- Dashboard de estadisticas avanzado con graficas
- Sistema de notificaciones en tiempo real (WebSockets)
- Galeria de imagenes para productos y perfiles
- Mapa interactivo del campus CUCEI
- Modulo de pedidos y seguimiento
- Aplicacion movil (React Native)
- Panel de administrador completo
- Integracion con correo institucional UDG para verificacion

---

## Seguridad

- Contrasenas hasheadas con bcrypt (12 rounds)
- Autenticacion JWT con expiracion configurable
- Rate limiting por IP
- Headers de seguridad con Helmet
- Usuario de BD de solo lectura para la IA (`cuceimart_ia_readonly`)
- Validacion de correo institucional UDG en registro de alumnos
- CORS configurado por lista de origenes permitidos

---

## Equipo

Desarrollado por **NEXCODE**

- GitHub: [github.com/NEXCODEMX](https://github.com/NEXCODEMX)
- Instagram: [@NexCode_MX](https://www.instagram.com/NexCode_MX/)
- YouTube: [@NexCodeMX](https://www.youtube.com/@NexCodeMX)

---

## Licencia

Proyecto academico desarrollado para el Centro Universitario de Ciencias Exactas e Ingenierias (CUCEI), Universidad de Guadalajara.

2026 CUCEI MART — NEXCODE
