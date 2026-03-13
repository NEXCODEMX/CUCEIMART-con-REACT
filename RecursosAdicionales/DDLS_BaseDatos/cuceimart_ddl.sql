-- =============================================================================
-- CUCEI MART - Base de Datos PostgreSQL
-- Desarrollado por: NEXCODE
-- Versión: 1.0 | Fecha: 2025-11-01
-- Descripción: Base de datos integral para la plataforma e-commerce universitaria
-- Compatible con: PostgreSQL 14+
-- Servidor objetivo: Raspberry Pi (Raspbian/Ubuntu)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- EXTENSIONES REQUERIDAS
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";       -- Generación de UUIDs
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- Búsqueda por similitud de texto
CREATE EXTENSION IF NOT EXISTS "unaccent";        -- Búsqueda sin acentos
CREATE EXTENSION IF NOT EXISTS "btree_gin";       -- Índices GIN para columnas compuestas

-- -----------------------------------------------------------------------------
-- CONFIGURACIÓN DE ESQUEMAS
-- -----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS cuceimart;
CREATE SCHEMA IF NOT EXISTS estadisticas;
CREATE SCHEMA IF NOT EXISTS media;

SET search_path TO cuceimart, estadisticas, media, public;

-- =============================================================================
-- SECCIÓN 1: TIPOS ENUMERADOS (ENUMS)
-- =============================================================================

-- Categorías de emprendimientos (basadas en el HTML de CUCEIMART)
CREATE TYPE cuceimart.categoria_negocio AS ENUM (
    'comida',
    'ropa',
    'accesorios',
    'cosmeticos',
    'decoraciones',
    'mascotas',
    'vapes',
    'videojuegos',
    'tecnologia',
    'libros',
    'juguetes',
    'suplementos',
    'regalos',
    'articulos_de_cocina',
    'muebles',
    'servicios',
    'educacion',
    'papeleria',
    'electronica',
    'otros'
);

-- Estado de cuenta de usuario/emprendedor
CREATE TYPE cuceimart.estado_cuenta AS ENUM (
    'activa',
    'inactiva',
    'suspendida',
    'pendiente_verificacion',
    'bloqueada'
);

-- Estado de publicación de productos
CREATE TYPE cuceimart.estado_producto AS ENUM (
    'activo',
    'inactivo',
    'agotado',
    'en_revision',
    'eliminado'
);

-- Nivel de membresía del emprendedor
CREATE TYPE cuceimart.nivel_membresia AS ENUM (
    'basico',
    'estandar',
    'premium',
    'destacado'
);

-- Tipo de imagen/media
CREATE TYPE media.tipo_media AS ENUM (
    'logo',
    'banner',
    'producto',
    'perfil',
    'galeria',
    'documento'
);

-- Estado de verificación del emprendedor
CREATE TYPE cuceimart.estado_verificacion AS ENUM (
    'pendiente',
    'en_revision',
    'aprobado',
    'rechazado',
    'expirado'
);

-- =============================================================================
-- SECCIÓN 2: TABLA DE ROLES Y PRIVILEGIOS
-- =============================================================================

CREATE TABLE IF NOT EXISTS cuceimart.roles (
    id_rol              SERIAL          PRIMARY KEY,
    nombre_rol          VARCHAR(50)     NOT NULL UNIQUE,
    descripcion         TEXT,
    puede_leer          BOOLEAN         NOT NULL DEFAULT TRUE,
    puede_escribir      BOOLEAN         NOT NULL DEFAULT FALSE,
    puede_editar        BOOLEAN         NOT NULL DEFAULT FALSE,
    puede_eliminar      BOOLEAN         NOT NULL DEFAULT FALSE,
    acceso_admin        BOOLEAN         NOT NULL DEFAULT FALSE,
    acceso_estadisticas BOOLEAN         NOT NULL DEFAULT FALSE,
    acceso_panel_emp    BOOLEAN         NOT NULL DEFAULT FALSE, -- Panel emprendedor
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Insertar roles base del sistema
INSERT INTO cuceimart.roles 
    (nombre_rol, descripcion, puede_leer, puede_escribir, puede_editar, puede_eliminar, acceso_admin, acceso_estadisticas, acceso_panel_emp)
VALUES
    ('superadmin',    'Administrador total del sistema. Acceso completo.',              TRUE, TRUE, TRUE, TRUE,  TRUE,  TRUE,  TRUE),
    ('admin',         'Administrador operativo. Gestión sin acceso a config crítica.',  TRUE, TRUE, TRUE, TRUE,  TRUE,  TRUE,  FALSE),
    ('emprendedor',   'Dueño de emprendimiento. Gestiona su propio negocio.',           TRUE, TRUE, TRUE, FALSE, FALSE, TRUE,  TRUE),
    ('cliente',       'Alumno registrado. Puede buscar, comentar y calificar.',         TRUE, TRUE, FALSE,FALSE, FALSE, FALSE, FALSE),
    ('observador_ia', 'Cuenta de solo lectura para la IA. Sin escritura. (Anti SQL-Injection)', TRUE, FALSE,FALSE,FALSE, FALSE, FALSE, FALSE),
    ('moderador',     'Puede revisar contenido y gestionar reportes.',                  TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE);

-- =============================================================================
-- SECCIÓN 3: USUARIOS CLIENTES (ALUMNOS UDG)
-- =============================================================================

CREATE TABLE IF NOT EXISTS cuceimart.clientes (
    id_cliente          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Datos académicos
    codigo_alumno       VARCHAR(20)     NOT NULL UNIQUE,   -- Ej: 224786978
    correo_udg          VARCHAR(120)    NOT NULL UNIQUE    CHECK (correo_udg LIKE '%@alumnos.udg.mx'),
    -- Datos personales
    nombre              VARCHAR(80)     NOT NULL,
    apellido_paterno    VARCHAR(80)     NOT NULL,
    apellido_materno    VARCHAR(80),
    nombre_usuario      VARCHAR(50)     NOT NULL UNIQUE,
    -- Seguridad
    contrasena_hash     TEXT            NOT NULL,           -- Bcrypt hash (costo ≥12)
    salt                VARCHAR(60),                        -- Salt adicional si aplica
    token_verificacion  TEXT,                               -- JWT para verificar correo
    token_expira_en     TIMESTAMPTZ,
    token_reset         TEXT,                               -- Para recuperar contraseña
    token_reset_expira  TIMESTAMPTZ,
    -- Estado
    id_rol              INT             NOT NULL DEFAULT 4 REFERENCES cuceimart.roles(id_rol),
    estado              cuceimart.estado_cuenta NOT NULL DEFAULT 'pendiente_verificacion',
    correo_verificado   BOOLEAN         NOT NULL DEFAULT FALSE,
    -- Preferencias
    avatar_url          TEXT,
    carrera             VARCHAR(100),
    semestre            SMALLINT        CHECK (semestre BETWEEN 1 AND 15),
    departamento        VARCHAR(100),
    -- Auditoría
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    ultimo_acceso       TIMESTAMPTZ,
    ip_registro         INET,
    -- Estadísticas de actividad
    total_comentarios   INT             NOT NULL DEFAULT 0,
    total_resenas       INT             NOT NULL DEFAULT 0,
    CONSTRAINT ck_codigo_alumno_numerico CHECK (codigo_alumno ~ '^\d{9}$')
);

-- =============================================================================
-- SECCIÓN 4: USUARIOS EMPRENDEDORES
-- =============================================================================

CREATE TABLE IF NOT EXISTS cuceimart.emprendedores (
    id_emprendedor      UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Datos académicos/personales del titular
    codigo_alumno       VARCHAR(20)     UNIQUE,             -- Puede ser alumno o egresado
    correo_udg          VARCHAR(120)    UNIQUE,             -- Correo institucional (opcional si es externo)
    correo_contacto     VARCHAR(120)    NOT NULL UNIQUE,    -- Correo público de contacto
    nombre              VARCHAR(80)     NOT NULL,
    apellido_paterno    VARCHAR(80)     NOT NULL,
    apellido_materno    VARCHAR(80),
    nombre_usuario      VARCHAR(50)     NOT NULL UNIQUE,
    -- Seguridad
    contrasena_hash     TEXT            NOT NULL,
    salt                VARCHAR(60),
    token_verificacion  TEXT,
    token_expira_en     TIMESTAMPTZ,
    token_reset         TEXT,
    token_reset_expira  TIMESTAMPTZ,
    -- Datos del emprendimiento
    nombre_negocio      VARCHAR(120)    NOT NULL,
    slug_negocio        VARCHAR(120)    NOT NULL UNIQUE,    -- URL amigable: "sanza-art"
    descripcion_corta   VARCHAR(280),                       -- Para tarjetas (Twitter-like)
    descripcion_larga   TEXT,                               -- Descripción completa
    -- Número de verificación exclusivo CUCEI MART
    num_verificacion    VARCHAR(30)     NOT NULL UNIQUE DEFAULT (
                            'CM-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('cuceimart.seq_verificacion')::TEXT, 5, '0')
                        ),
    -- Categorías del negocio (múltiples categorías posibles)
    categorias          cuceimart.categoria_negocio[] NOT NULL DEFAULT '{}',
    categoria_principal cuceimart.categoria_negocio  NOT NULL,
    -- Contacto
    whatsapp            VARCHAR(20),                        -- Formato: 523312345678
    instagram           VARCHAR(120),
    facebook            VARCHAR(200),
    tiktok              VARCHAR(120),
    website_externo     VARCHAR(300),
    telefono            VARCHAR(20),
    -- Ubicación en campus
    edificio_id         VARCHAR(10),                        -- Ej: "U", "A", "B"
    zona_id             VARCHAR(60),                        -- Ej: "lab_ingenierias"
    mapa_x              DECIMAL(5,4)    CHECK (mapa_x BETWEEN 0 AND 1),
    mapa_y              DECIMAL(5,4)    CHECK (mapa_y BETWEEN 0 AND 1),
    -- Estado y membresía
    id_rol              INT             NOT NULL DEFAULT 3 REFERENCES cuceimart.roles(id_rol),
    nivel_membresia     cuceimart.nivel_membresia NOT NULL DEFAULT 'basico',
    estado              cuceimart.estado_cuenta NOT NULL DEFAULT 'pendiente_verificacion',
    estado_verificacion cuceimart.estado_verificacion NOT NULL DEFAULT 'pendiente',
    correo_verificado   BOOLEAN         NOT NULL DEFAULT FALSE,
    -- Clave de privilegios para panel web de emprendedor
    api_key_panel       UUID            NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    api_key_expira      TIMESTAMPTZ     NOT NULL DEFAULT (NOW() + INTERVAL '1 year'),
    -- Reputación calculada
    reputacion_promedio DECIMAL(3,2)    NOT NULL DEFAULT 0.00 CHECK (reputacion_promedio BETWEEN 0 AND 5),
    total_resenas       INT             NOT NULL DEFAULT 0,
    total_ventas        INT             NOT NULL DEFAULT 0,  -- Contador de ventas (futuro)
    total_productos     INT             NOT NULL DEFAULT 0,
    -- Datos financieros básicos (para estadísticas futuras)
    precio_minimo       DECIMAL(10,2)   CHECK (precio_minimo >= 0),
    precio_maximo       DECIMAL(10,2)   CHECK (precio_maximo >= 0),
    moneda              CHAR(3)         NOT NULL DEFAULT 'MXN',
    -- Destacado
    es_destacado        BOOLEAN         NOT NULL DEFAULT FALSE,
    orden_destacado     SMALLINT        DEFAULT 0,           -- Para ordenar los destacados
    -- Auditoría
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    ultimo_acceso       TIMESTAMPTZ,
    ip_registro         INET,
    -- Metadatos SEO
    meta_titulo         VARCHAR(120),
    meta_descripcion    VARCHAR(280),
    palabras_clave      TEXT[],
    CONSTRAINT ck_precios_validos CHECK (precio_maximo IS NULL OR precio_minimo IS NULL OR precio_maximo >= precio_minimo)
);

-- Secuencia para números de verificación
CREATE SEQUENCE IF NOT EXISTS cuceimart.seq_verificacion START 1000;

-- =============================================================================
-- SECCIÓN 5: EMPRENDEDORES DESTACADOS (Tabla especial)
-- =============================================================================

CREATE TABLE IF NOT EXISTS cuceimart.emprendedores_destacados (
    id_destacado        SERIAL          PRIMARY KEY,
    id_emprendedor      UUID            NOT NULL REFERENCES cuceimart.emprendedores(id_emprendedor) ON DELETE CASCADE,
    -- Posición en el banner/carrusel
    posicion_banner     SMALLINT        NOT NULL DEFAULT 1,
    -- Período de destacado
    fecha_inicio        DATE            NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin           DATE,
    -- Contenido especial para la tarjeta destacada
    titulo_promocional  VARCHAR(120),
    descripcion_promo   VARCHAR(280),
    imagen_banner_url   TEXT,           -- Imagen especial para el banner
    url_destino         TEXT,           -- URL al hacer click en el banner
    -- Métricas del destacado
    clics_banner        INT             NOT NULL DEFAULT 0,
    impresiones         INT             NOT NULL DEFAULT 0,
    -- Quién lo aprobó
    aprobado_por        INT             REFERENCES cuceimart.roles(id_rol),
    notas_admin         TEXT,
    -- Auditoría
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    activo              BOOLEAN         NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_emprendedor_activo UNIQUE (id_emprendedor, activo),
    CONSTRAINT ck_fechas_destacado CHECK (fecha_fin IS NULL OR fecha_fin > fecha_inicio)
);

-- =============================================================================
-- SECCIÓN 6: MEDIA / IMÁGENES
-- =============================================================================

CREATE TABLE IF NOT EXISTS media.archivos (
    id_archivo          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Asociación polimórfica
    entidad_tipo        VARCHAR(30)     NOT NULL,           -- 'emprendedor', 'producto', 'cliente'
    entidad_id          UUID            NOT NULL,
    -- Datos del archivo
    tipo                media.tipo_media NOT NULL,
    nombre_original     VARCHAR(255)    NOT NULL,
    nombre_almacenado   VARCHAR(255)    NOT NULL UNIQUE,    -- Nombre en disco/CDN
    ruta_relativa       TEXT            NOT NULL,           -- Ruta desde la raíz media
    url_publica         TEXT,                               -- URL accesible públicamente
    url_thumbnail       TEXT,                               -- Miniatura generada
    -- Metadatos del archivo
    mime_type           VARCHAR(80)     NOT NULL,
    tamano_bytes        BIGINT          NOT NULL,
    ancho_px            INT,
    alto_px             INT,
    -- Estado
    es_principal        BOOLEAN         NOT NULL DEFAULT FALSE, -- Logo principal / foto principal
    orden               SMALLINT        NOT NULL DEFAULT 0,
    activo              BOOLEAN         NOT NULL DEFAULT TRUE,
    -- Auditoría
    subido_por          UUID,           -- FK a cliente o emprendedor
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_tamano_max CHECK (tamano_bytes <= 52428800) -- Max 50MB
);

-- =============================================================================
-- SECCIÓN 7: PRODUCTOS / CATÁLOGO
-- =============================================================================

CREATE TABLE IF NOT EXISTS cuceimart.productos (
    id_producto         UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_emprendedor      UUID            NOT NULL REFERENCES cuceimart.emprendedores(id_emprendedor) ON DELETE CASCADE,
    -- Información básica
    nombre              VARCHAR(200)    NOT NULL,
    descripcion         TEXT,
    descripcion_corta   VARCHAR(280),
    -- Categorización (puede pertenecer a múltiples categorías)
    categorias          cuceimart.categoria_negocio[] NOT NULL DEFAULT '{}',
    categoria_principal cuceimart.categoria_negocio  NOT NULL,
    -- Precios
    precio              DECIMAL(10,2)   NOT NULL CHECK (precio >= 0),
    precio_anterior     DECIMAL(10,2)   CHECK (precio_anterior >= 0), -- Para mostrar descuento
    moneda              CHAR(3)         NOT NULL DEFAULT 'MXN',
    precio_texto        VARCHAR(60),                        -- Ej: "Desde $250 MXN"
    tiene_descuento     BOOLEAN         NOT NULL DEFAULT FALSE,
    porcentaje_descuento SMALLINT       CHECK (porcentaje_descuento BETWEEN 0 AND 100),
    -- Inventario básico
    disponible          BOOLEAN         NOT NULL DEFAULT TRUE,
    cantidad_stock      INT             DEFAULT NULL,       -- NULL = ilimitado / servicio
    -- SEO y metadatos
    slug                VARCHAR(200)    NOT NULL,
    palabras_clave      TEXT[],
    -- Estado
    estado              cuceimart.estado_producto NOT NULL DEFAULT 'en_revision',
    es_destacado        BOOLEAN         NOT NULL DEFAULT FALSE,
    -- Métricas del producto
    vistas              INT             NOT NULL DEFAULT 0,
    total_vendido       INT             NOT NULL DEFAULT 0,
    calificacion_prom   DECIMAL(3,2)    NOT NULL DEFAULT 0.00 CHECK (calificacion_prom BETWEEN 0 AND 5),
    total_resenas       INT             NOT NULL DEFAULT 0,
    -- Auditoría
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_producto_slug_emp UNIQUE (id_emprendedor, slug)
);

-- =============================================================================
-- SECCIÓN 8: COMENTARIOS Y RESEÑAS
-- =============================================================================

CREATE TABLE IF NOT EXISTS cuceimart.resenas (
    id_resena           UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Quién y a quién
    id_cliente          UUID            NOT NULL REFERENCES cuceimart.clientes(id_cliente) ON DELETE CASCADE,
    id_emprendedor      UUID            NOT NULL REFERENCES cuceimart.emprendedores(id_emprendedor) ON DELETE CASCADE,
    id_producto         UUID            REFERENCES cuceimart.productos(id_producto) ON DELETE SET NULL, -- Opcional: reseña de producto específico
    -- Contenido
    calificacion        SMALLINT        NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    titulo              VARCHAR(100),
    comentario          TEXT            NOT NULL CHECK (LENGTH(TRIM(comentario)) >= 10),
    -- Estado de moderación
    aprobado            BOOLEAN         NOT NULL DEFAULT FALSE,
    moderado_por        INT             REFERENCES cuceimart.roles(id_rol),
    razon_rechazo       TEXT,
    -- Reacciones
    total_utiles        INT             NOT NULL DEFAULT 0, -- "¿Fue útil esta reseña?"
    -- Auditoría
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    editado             BOOLEAN         NOT NULL DEFAULT FALSE,
    ip_origen           INET,
    -- Un cliente solo puede dejar una reseña por emprendedor
    CONSTRAINT uq_resena_cliente_emp UNIQUE (id_cliente, id_emprendedor)
);

-- Respuestas del emprendedor a reseñas
CREATE TABLE IF NOT EXISTS cuceimart.respuestas_resenas (
    id_respuesta        UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_resena           UUID            NOT NULL REFERENCES cuceimart.resenas(id_resena) ON DELETE CASCADE UNIQUE,
    id_emprendedor      UUID            NOT NULL REFERENCES cuceimart.emprendedores(id_emprendedor) ON DELETE CASCADE,
    respuesta           TEXT            NOT NULL CHECK (LENGTH(TRIM(respuesta)) >= 5),
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SECCIÓN 9: ESTADÍSTICAS DE EMPRENDEDORES
-- =============================================================================

CREATE TABLE IF NOT EXISTS estadisticas.visitas_perfil (
    id_visita           BIGSERIAL       PRIMARY KEY,
    id_emprendedor      UUID            NOT NULL REFERENCES cuceimart.emprendedores(id_emprendedor) ON DELETE CASCADE,
    -- Información de la visita
    fecha               DATE            NOT NULL DEFAULT CURRENT_DATE,
    hora                TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    id_cliente          UUID            REFERENCES cuceimart.clientes(id_cliente) ON DELETE SET NULL, -- NULL = anónimo
    ip_visitante        INET,
    user_agent          TEXT,
    referer             TEXT,           -- De dónde vino (buscador, red social, etc.)
    dispositivo         VARCHAR(20),    -- 'desktop', 'mobile', 'tablet'
    pais                CHAR(2),
    ciudad              VARCHAR(80)
);

-- Tabla de estadísticas diarias agregadas (para consultas rápidas)
CREATE TABLE IF NOT EXISTS estadisticas.resumen_diario (
    id                  BIGSERIAL       PRIMARY KEY,
    id_emprendedor      UUID            NOT NULL REFERENCES cuceimart.emprendedores(id_emprendedor) ON DELETE CASCADE,
    fecha               DATE            NOT NULL,
    -- Métricas del día
    visitas_totales     INT             NOT NULL DEFAULT 0,
    visitas_unicas      INT             NOT NULL DEFAULT 0,
    clics_whatsapp      INT             NOT NULL DEFAULT 0,
    clics_instagram     INT             NOT NULL DEFAULT 0,
    clics_website       INT             NOT NULL DEFAULT 0,
    clics_productos     INT             NOT NULL DEFAULT 0,
    nuevas_resenas      INT             NOT NULL DEFAULT 0,
    reputacion_dia      DECIMAL(3,2)    DEFAULT 0.00,
    CONSTRAINT uq_resumen_dia UNIQUE (id_emprendedor, fecha)
);

-- Métricas de clics en enlaces de contacto
CREATE TABLE IF NOT EXISTS estadisticas.clics_contacto (
    id_clic             BIGSERIAL       PRIMARY KEY,
    id_emprendedor      UUID            NOT NULL REFERENCES cuceimart.emprendedores(id_emprendedor) ON DELETE CASCADE,
    tipo_clic           VARCHAR(30)     NOT NULL CHECK (tipo_clic IN ('whatsapp','instagram','facebook','tiktok','website','mapa','ver_negocio','banner')),
    fecha               TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    id_cliente          UUID            REFERENCES cuceimart.clientes(id_cliente) ON DELETE SET NULL,
    ip_origen           INET,
    id_producto         UUID            REFERENCES cuceimart.productos(id_producto) ON DELETE SET NULL
);

-- =============================================================================
-- SECCIÓN 10: REPORTES Y MODERACIÓN
-- =============================================================================

CREATE TABLE IF NOT EXISTS cuceimart.reportes (
    id_reporte          SERIAL          PRIMARY KEY,
    -- Quién reporta
    id_cliente          UUID            REFERENCES cuceimart.clientes(id_cliente) ON DELETE SET NULL,
    -- Qué se reporta (polimórfico)
    entidad_tipo        VARCHAR(30)     NOT NULL CHECK (entidad_tipo IN ('emprendedor','producto','resena')),
    entidad_id          UUID            NOT NULL,
    -- Detalle del reporte
    motivo              VARCHAR(50)     NOT NULL,
    descripcion         TEXT,
    -- Estado
    estado              VARCHAR(20)     NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','en_revision','resuelto','descartado')),
    resuelto_por        INT             REFERENCES cuceimart.roles(id_rol),
    resolucion          TEXT,
    -- Auditoría
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    resuelto_en         TIMESTAMPTZ
);

-- =============================================================================
-- SECCIÓN 11: NOTIFICACIONES
-- =============================================================================

CREATE TABLE IF NOT EXISTS cuceimart.notificaciones (
    id_notificacion     BIGSERIAL       PRIMARY KEY,
    -- Destinatario (uno u otro)
    id_cliente          UUID            REFERENCES cuceimart.clientes(id_cliente) ON DELETE CASCADE,
    id_emprendedor      UUID            REFERENCES cuceimart.emprendedores(id_emprendedor) ON DELETE CASCADE,
    -- Contenido
    tipo                VARCHAR(40)     NOT NULL,
    titulo              VARCHAR(120)    NOT NULL,
    mensaje             TEXT            NOT NULL,
    url_accion          TEXT,
    -- Estado
    leida               BOOLEAN         NOT NULL DEFAULT FALSE,
    leida_en            TIMESTAMPTZ,
    -- Auditoría
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_un_destinatario CHECK (
        (id_cliente IS NOT NULL AND id_emprendedor IS NULL) OR
        (id_cliente IS NULL AND id_emprendedor IS NOT NULL)
    )
);

-- =============================================================================
-- SECCIÓN 12: SESIONES Y TOKENS DE AUTENTICACIÓN
-- =============================================================================

CREATE TABLE IF NOT EXISTS cuceimart.sesiones (
    id_sesion           UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- A quién pertenece la sesión
    entidad_tipo        VARCHAR(20)     NOT NULL CHECK (entidad_tipo IN ('cliente','emprendedor')),
    entidad_id          UUID            NOT NULL,
    -- Token
    refresh_token       TEXT            NOT NULL UNIQUE,
    expira_en           TIMESTAMPTZ     NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    -- Metadata
    ip_origen           INET,
    user_agent          TEXT,
    dispositivo         VARCHAR(20),
    activa              BOOLEAN         NOT NULL DEFAULT TRUE,
    -- Auditoría
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    ultimo_uso          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SECCIÓN 13: ÍNDICES PARA RENDIMIENTO
-- =============================================================================

-- Clientes
CREATE INDEX IF NOT EXISTS idx_clientes_codigo ON cuceimart.clientes(codigo_alumno);
CREATE INDEX IF NOT EXISTS idx_clientes_correo ON cuceimart.clientes(correo_udg);
CREATE INDEX IF NOT EXISTS idx_clientes_estado ON cuceimart.clientes(estado);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre_trgm ON cuceimart.clientes USING GIN (nombre gin_trgm_ops);

-- Emprendedores
CREATE INDEX IF NOT EXISTS idx_emp_slug ON cuceimart.emprendedores(slug_negocio);
CREATE INDEX IF NOT EXISTS idx_emp_estado ON cuceimart.emprendedores(estado);
CREATE INDEX IF NOT EXISTS idx_emp_destacado ON cuceimart.emprendedores(es_destacado) WHERE es_destacado = TRUE;
CREATE INDEX IF NOT EXISTS idx_emp_categorias ON cuceimart.emprendedores USING GIN(categorias);
CREATE INDEX IF NOT EXISTS idx_emp_nombre_trgm ON cuceimart.emprendedores USING GIN (nombre_negocio gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_emp_reputacion ON cuceimart.emprendedores(reputacion_promedio DESC);

-- Productos
CREATE INDEX IF NOT EXISTS idx_prod_emprendedor ON cuceimart.productos(id_emprendedor);
CREATE INDEX IF NOT EXISTS idx_prod_categorias ON cuceimart.productos USING GIN(categorias);
CREATE INDEX IF NOT EXISTS idx_prod_estado ON cuceimart.productos(estado);
CREATE INDEX IF NOT EXISTS idx_prod_precio ON cuceimart.productos(precio);
CREATE INDEX IF NOT EXISTS idx_prod_nombre_trgm ON cuceimart.productos USING GIN (nombre gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_prod_destacado ON cuceimart.productos(es_destacado) WHERE es_destacado = TRUE;

-- Reseñas
CREATE INDEX IF NOT EXISTS idx_resenas_emprendedor ON cuceimart.resenas(id_emprendedor);
CREATE INDEX IF NOT EXISTS idx_resenas_cliente ON cuceimart.resenas(id_cliente);
CREATE INDEX IF NOT EXISTS idx_resenas_calificacion ON cuceimart.resenas(calificacion);
CREATE INDEX IF NOT EXISTS idx_resenas_aprobadas ON cuceimart.resenas(aprobado) WHERE aprobado = TRUE;

-- Estadísticas
CREATE INDEX IF NOT EXISTS idx_visitas_emp_fecha ON estadisticas.visitas_perfil(id_emprendedor, fecha);
CREATE INDEX IF NOT EXISTS idx_resumen_emp_fecha ON estadisticas.resumen_diario(id_emprendedor, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_clics_emp_tipo ON estadisticas.clics_contacto(id_emprendedor, tipo_clic);

-- Media
CREATE INDEX IF NOT EXISTS idx_media_entidad ON media.archivos(entidad_tipo, entidad_id);
CREATE INDEX IF NOT EXISTS idx_media_tipo ON media.archivos(tipo);
CREATE INDEX IF NOT EXISTS idx_media_principal ON media.archivos(es_principal) WHERE es_principal = TRUE;

-- Sesiones
CREATE INDEX IF NOT EXISTS idx_sesiones_entidad ON cuceimart.sesiones(entidad_tipo, entidad_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_activas ON cuceimart.sesiones(activa, expira_en) WHERE activa = TRUE;

-- =============================================================================
-- SECCIÓN 14: VISTAS PARA CONSULTAS FRECUENTES
-- =============================================================================

-- Vista: Emprendedores activos con su imagen principal y categorías
CREATE OR REPLACE VIEW cuceimart.v_emprendedores_activos AS
SELECT
    e.id_emprendedor,
    e.nombre_negocio,
    e.slug_negocio,
    e.descripcion_corta,
    e.categorias,
    e.categoria_principal,
    e.reputacion_promedio,
    e.total_resenas,
    e.total_productos,
    e.es_destacado,
    e.nivel_membresia,
    e.whatsapp,
    e.instagram,
    e.website_externo,
    e.edificio_id,
    e.zona_id,
    e.mapa_x,
    e.mapa_y,
    e.precio_minimo,
    e.precio_maximo,
    e.moneda,
    m.url_publica       AS logo_url,
    m.url_thumbnail     AS logo_thumbnail
FROM cuceimart.emprendedores e
LEFT JOIN media.archivos m ON (
    m.entidad_tipo = 'emprendedor'
    AND m.entidad_id = e.id_emprendedor
    AND m.tipo = 'logo'
    AND m.es_principal = TRUE
    AND m.activo = TRUE
)
WHERE e.estado = 'activa'
  AND e.estado_verificacion = 'aprobado';

-- Vista: Emprendedores destacados en orden para el banner
CREATE OR REPLACE VIEW cuceimart.v_banner_destacados AS
SELECT
    ed.id_destacado,
    ed.posicion_banner,
    ed.titulo_promocional,
    ed.descripcion_promo,
    ed.imagen_banner_url,
    ed.url_destino,
    e.id_emprendedor,
    e.nombre_negocio,
    e.slug_negocio,
    e.reputacion_promedio
FROM cuceimart.emprendedores_destacados ed
INNER JOIN cuceimart.emprendedores e ON e.id_emprendedor = ed.id_emprendedor
WHERE ed.activo = TRUE
  AND (ed.fecha_fin IS NULL OR ed.fecha_fin >= CURRENT_DATE)
  AND e.estado = 'activa'
ORDER BY ed.posicion_banner ASC;

-- Vista: Reseñas aprobadas con datos del cliente
CREATE OR REPLACE VIEW cuceimart.v_resenas_publicas AS
SELECT
    r.id_resena,
    r.id_emprendedor,
    r.id_producto,
    r.calificacion,
    r.titulo,
    r.comentario,
    r.total_utiles,
    r.creado_en,
    r.editado,
    c.nombre_usuario    AS autor_usuario,
    c.avatar_url        AS autor_avatar,
    rr.respuesta        AS respuesta_emprendedor,
    rr.creado_en        AS respuesta_fecha
FROM cuceimart.resenas r
INNER JOIN cuceimart.clientes c ON c.id_cliente = r.id_cliente
LEFT JOIN cuceimart.respuestas_resenas rr ON rr.id_resena = r.id_resena
WHERE r.aprobado = TRUE;

-- Vista: Dashboard de estadísticas del emprendedor (últimos 30 días)
CREATE OR REPLACE VIEW estadisticas.v_dashboard_emprendedor AS
SELECT
    e.id_emprendedor,
    e.nombre_negocio,
    e.reputacion_promedio,
    e.total_resenas,
    e.total_productos,
    COALESCE(SUM(rd.visitas_totales), 0)    AS visitas_30_dias,
    COALESCE(SUM(rd.visitas_unicas), 0)     AS visitas_unicas_30_dias,
    COALESCE(SUM(rd.clics_whatsapp), 0)     AS clics_whatsapp_30_dias,
    COALESCE(SUM(rd.clics_instagram), 0)    AS clics_instagram_30_dias,
    COALESCE(SUM(rd.clics_website), 0)      AS clics_website_30_dias,
    COALESCE(SUM(rd.nuevas_resenas), 0)     AS resenas_30_dias
FROM cuceimart.emprendedores e
LEFT JOIN estadisticas.resumen_diario rd ON (
    rd.id_emprendedor = e.id_emprendedor
    AND rd.fecha >= CURRENT_DATE - INTERVAL '30 days'
)
GROUP BY e.id_emprendedor, e.nombre_negocio, e.reputacion_promedio, e.total_resenas, e.total_productos;

-- =============================================================================
-- SECCIÓN 15: FUNCIONES Y TRIGGERS
-- =============================================================================

-- Función: Actualizar campo actualizado_en automáticamente
CREATE OR REPLACE FUNCTION cuceimart.fn_actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función: Recalcular reputación del emprendedor al insertar/actualizar reseña
CREATE OR REPLACE FUNCTION cuceimart.fn_actualizar_reputacion()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE cuceimart.emprendedores
    SET reputacion_promedio = (
            SELECT COALESCE(AVG(calificacion::DECIMAL), 0)
            FROM cuceimart.resenas
            WHERE id_emprendedor = NEW.id_emprendedor AND aprobado = TRUE
        ),
        total_resenas = (
            SELECT COUNT(*) FROM cuceimart.resenas
            WHERE id_emprendedor = NEW.id_emprendedor AND aprobado = TRUE
        ),
        actualizado_en = NOW()
    WHERE id_emprendedor = NEW.id_emprendedor;

    -- Actualizar también contador de reseñas del cliente
    UPDATE cuceimart.clientes
    SET total_resenas = (
            SELECT COUNT(*) FROM cuceimart.resenas
            WHERE id_cliente = NEW.id_cliente
        ),
        actualizado_en = NOW()
    WHERE id_cliente = NEW.id_cliente;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función: Actualizar total_productos del emprendedor
CREATE OR REPLACE FUNCTION cuceimart.fn_actualizar_total_productos()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE cuceimart.emprendedores
    SET total_productos = (
            SELECT COUNT(*) FROM cuceimart.productos
            WHERE id_emprendedor = NEW.id_emprendedor AND estado = 'activo'
        ),
        actualizado_en = NOW()
    WHERE id_emprendedor = NEW.id_emprendedor;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función: Generar resumen diario de estadísticas
CREATE OR REPLACE FUNCTION estadisticas.fn_generar_resumen_diario(p_fecha DATE DEFAULT CURRENT_DATE - 1)
RETURNS VOID AS $$
BEGIN
    INSERT INTO estadisticas.resumen_diario (
        id_emprendedor, fecha,
        visitas_totales, visitas_unicas,
        clics_whatsapp, clics_instagram, clics_website, clics_productos,
        nuevas_resenas, reputacion_dia
    )
    SELECT
        e.id_emprendedor,
        p_fecha,
        COALESCE(v.visitas_totales, 0),
        COALESCE(v.visitas_unicas, 0),
        COALESCE(cc.clics_whatsapp, 0),
        COALESCE(cc.clics_instagram, 0),
        COALESCE(cc.clics_website, 0),
        COALESCE(cc.clics_productos, 0),
        COALESCE(nr.nuevas_resenas, 0),
        e.reputacion_promedio
    FROM cuceimart.emprendedores e
    LEFT JOIN (
        SELECT id_emprendedor,
               COUNT(*) AS visitas_totales,
               COUNT(DISTINCT ip_visitante) AS visitas_unicas
        FROM estadisticas.visitas_perfil
        WHERE fecha = p_fecha
        GROUP BY id_emprendedor
    ) v ON v.id_emprendedor = e.id_emprendedor
    LEFT JOIN (
        SELECT id_emprendedor,
               SUM(CASE WHEN tipo_clic='whatsapp'  THEN 1 ELSE 0 END) AS clics_whatsapp,
               SUM(CASE WHEN tipo_clic='instagram' THEN 1 ELSE 0 END) AS clics_instagram,
               SUM(CASE WHEN tipo_clic='website'   THEN 1 ELSE 0 END) AS clics_website,
               SUM(CASE WHEN tipo_clic='ver_negocio' THEN 1 ELSE 0 END) AS clics_productos
        FROM estadisticas.clics_contacto
        WHERE DATE(fecha) = p_fecha
        GROUP BY id_emprendedor
    ) cc ON cc.id_emprendedor = e.id_emprendedor
    LEFT JOIN (
        SELECT id_emprendedor, COUNT(*) AS nuevas_resenas
        FROM cuceimart.resenas
        WHERE DATE(creado_en) = p_fecha AND aprobado = TRUE
        GROUP BY id_emprendedor
    ) nr ON nr.id_emprendedor = e.id_emprendedor
    ON CONFLICT (id_emprendedor, fecha) DO UPDATE
    SET visitas_totales  = EXCLUDED.visitas_totales,
        visitas_unicas   = EXCLUDED.visitas_unicas,
        clics_whatsapp   = EXCLUDED.clics_whatsapp,
        clics_instagram  = EXCLUDED.clics_instagram,
        clics_website    = EXCLUDED.clics_website,
        clics_productos  = EXCLUDED.clics_productos,
        nuevas_resenas   = EXCLUDED.nuevas_resenas,
        reputacion_dia   = EXCLUDED.reputacion_dia;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SECCIÓN 16: TRIGGERS
-- =============================================================================

-- Trigger: timestamp en clientes
CREATE TRIGGER trg_clientes_ts
    BEFORE UPDATE ON cuceimart.clientes
    FOR EACH ROW EXECUTE FUNCTION cuceimart.fn_actualizar_timestamp();

-- Trigger: timestamp en emprendedores
CREATE TRIGGER trg_emprendedores_ts
    BEFORE UPDATE ON cuceimart.emprendedores
    FOR EACH ROW EXECUTE FUNCTION cuceimart.fn_actualizar_timestamp();

-- Trigger: timestamp en productos
CREATE TRIGGER trg_productos_ts
    BEFORE UPDATE ON cuceimart.productos
    FOR EACH ROW EXECUTE FUNCTION cuceimart.fn_actualizar_timestamp();

-- Trigger: recalcular reputación al aprobar/cambiar reseña
CREATE TRIGGER trg_resena_reputacion
    AFTER INSERT OR UPDATE OF calificacion, aprobado ON cuceimart.resenas
    FOR EACH ROW EXECUTE FUNCTION cuceimart.fn_actualizar_reputacion();

-- Trigger: actualizar total_productos
CREATE TRIGGER trg_productos_conteo
    AFTER INSERT OR UPDATE OF estado OR DELETE ON cuceimart.productos
    FOR EACH ROW EXECUTE FUNCTION cuceimart.fn_actualizar_total_productos();

-- =============================================================================
-- SECCIÓN 17: USUARIOS DE BASE DE DATOS (Ejecutar como superusuario)
-- =============================================================================

-- Usuario Administrador (acceso completo a cuceimart)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cuceimart_admin') THEN
        CREATE ROLE cuceimart_admin WITH LOGIN PASSWORD 'CAMBIAR_PASSWORD_ADMIN_SEGURA';
    END IF;
END $$;

GRANT ALL PRIVILEGES ON DATABASE postgres TO cuceimart_admin;  -- Cambiar 'postgres' por el nombre de tu DB
GRANT ALL PRIVILEGES ON SCHEMA cuceimart, estadisticas, media TO cuceimart_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cuceimart TO cuceimart_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA estadisticas TO cuceimart_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA media TO cuceimart_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA cuceimart TO cuceimart_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA estadisticas TO cuceimart_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA cuceimart TO cuceimart_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA estadisticas TO cuceimart_admin;

-- Usuario de Solo Lectura (para la IA - Anti SQL Injection)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cuceimart_ia_readonly') THEN
        CREATE ROLE cuceimart_ia_readonly WITH LOGIN PASSWORD 'CAMBIAR_PASSWORD_IA_SEGURA';
    END IF;
END $$;

GRANT CONNECT ON DATABASE postgres TO cuceimart_ia_readonly;
GRANT USAGE ON SCHEMA cuceimart, estadisticas, media TO cuceimart_ia_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA cuceimart TO cuceimart_ia_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA estadisticas TO cuceimart_ia_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA media TO cuceimart_ia_readonly;

-- Revocar permisos de escritura explícitamente para la IA
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA cuceimart FROM cuceimart_ia_readonly;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA estadisticas FROM cuceimart_ia_readonly;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA media FROM cuceimart_ia_readonly;

-- =============================================================================
-- SECCIÓN 18: DATOS DE EJEMPLO (EMPRENDIMIENTOS REGISTRADOS EN EL CÓDIGO)
-- =============================================================================
-- NOTA: Estos datos son de ejemplo. Elimínalos antes del lanzamiento con:
-- DELETE FROM cuceimart.productos;
-- DELETE FROM cuceimart.emprendedores_destacados;
-- DELETE FROM cuceimart.emprendedores;
-- DELETE FROM cuceimart.clientes;

-- Insertar emprendedores de ejemplo (basados en Shop.js + ficticios)
INSERT INTO cuceimart.emprendedores (
    codigo_alumno, correo_contacto, nombre, apellido_paterno, nombre_usuario,
    contrasena_hash, nombre_negocio, slug_negocio, descripcion_corta, descripcion_larga,
    categorias, categoria_principal,
    whatsapp, instagram, website_externo,
    edificio_id, zona_id, mapa_x, mapa_y,
    estado, estado_verificacion, correo_verificado,
    precio_minimo, precio_maximo, precio_texto,
    es_destacado, nivel_membresia
) VALUES
-- 1. SANZA ART (del código)
(
    '224786978',
    'sanzaart@gmail.com',
    'Itzamara', 'Sánchez', 'sanza_art',
    '$2b$12$HASH_EJEMPLO_SANZA',
    'SANZA ART', 'sanza-art',
    'Cuadros personalizados artísticos únicos para ti.',
    'SANZA ART se especializa en la creación de cuadros personalizados únicos, combinando técnicas artísticas modernas con tu visión personal. Ideal para regalos y decoración.',
    ARRAY['decoraciones','regalos']::cuceimart.categoria_negocio[],
    'decoraciones',
    '523343408028', 'https://www.instagram.com/sanza.art/', 'https://nexcodemx.github.io/SanzaArt/SanzaArt.html',
    'U', 'lab_ingenierias', 0.78, 0.40,
    'activa', 'aprobado', TRUE,
    250.00, 1500.00, 'Desde $250 MXN',
    TRUE, 'destacado'
),
-- 2. NEXCODE (del código)
(
    NULL,
    'nexcodemx@gmail.com',
    'Demian', 'Fernandez', 'nexcode_mx',
    '$2b$12$HASH_EJEMPLO_NEXCODE',
    'NEXCODE', 'nexcode',
    'Cursos en línea y desarrollo web profesional para potenciar tus habilidades.',
    'NEXCODE es una plataforma de tecnología y educación que ofrece cursos en línea, desarrollo web profesional y soluciones digitales para emprendedores universitarios.',
    ARRAY['educacion','tecnologia','servicios']::cuceimart.categoria_negocio[],
    'educacion',
    '523343408028', 'https://www.instagram.com/NexCode_MX/', 'https://nexcodemx.github.io/NEXCODE/',
    NULL, NULL, NULL, NULL,
    'activa', 'aprobado', TRUE,
    0.00, 5000.00, 'Acceso Gratuito / Desde $299 MXN',
    TRUE, 'premium'
),
-- 3. Papelería Express (del código, expandido)
(
    '219501234',
    'papeleria.cucei@gmail.com',
    'Carlos', 'Morales', 'papeleria_cucei',
    '$2b$12$HASH_EJEMPLO_PAPELERIA',
    'Papelería Express CUCEI', 'papeleria-express-cucei',
    'Impresiones, copias, engargolados y material escolar. Rápido y económico.',
    'Tu papelería de confianza dentro del campus CUCEI. Ofrecemos servicios de impresión láser, copias, engargolado, laminado y venta de material escolar a los mejores precios.',
    ARRAY['servicios','otros']::cuceimart.categoria_negocio[],
    'servicios',
    '523312345678', '', '',
    'A', 'papelerias', 0.35, 0.70,
    'activa', 'aprobado', TRUE,
    0.20, 150.00, 'Desde $0.20 MXN',
    FALSE, 'estandar'
),
-- 4. Emprendimiento ficticio: Cocina Universitaria
(
    '220987654',
    'cocinauniversitaria@gmail.com',
    'Valeria', 'Ramírez', 'cocina_uni_cucei',
    '$2b$12$HASH_EJEMPLO_COCINA',
    'Cocina Universitaria', 'cocina-universitaria',
    'Platillos caseros y saludables preparados con amor para la comunidad CUCEI.',
    'Comida casera, nutritiva y accesible para estudiantes. Menú semanal variado con opciones vegetarianas. Pedidos con anticipación por WhatsApp.',
    ARRAY['comida']::cuceimart.categoria_negocio[],
    'comida',
    '523398765432', '@cocina_uni_cucei', '',
    'B', 'cafeteria_central', 0.50, 0.65,
    'activa', 'aprobado', TRUE,
    35.00, 120.00, 'Desde $35 MXN',
    FALSE, 'basico'
),
-- 5. Emprendimiento ficticio: TechZone CUCEI
(
    '221456789',
    'techzone.cucei@gmail.com',
    'Rodrigo', 'López', 'techzone_cucei',
    '$2b$12$HASH_EJEMPLO_TECHZONE',
    'TechZone CUCEI', 'techzone-cucei',
    'Accesorios tecnológicos, fundas, cables y gadgets al mejor precio del campus.',
    'TechZone CUCEI es tu tienda de tecnología dentro del campus. Fundas para celular, cables, cargadores, teclados, mouses y más. Envíos por campus o recoge en punto de reunión.',
    ARRAY['tecnologia','accesorios']::cuceimart.categoria_negocio[],
    'tecnologia',
    '523356781234', '@techzone_cucei', '',
    'C', 'laboratorios_computo', 0.60, 0.45,
    'activa', 'aprobado', TRUE,
    50.00, 2000.00, 'Desde $50 MXN',
    FALSE, 'estandar'
);

-- Insertar emprendedores destacados
INSERT INTO cuceimart.emprendedores_destacados (
    id_emprendedor, posicion_banner, titulo_promocional, descripcion_promo,
    url_destino, activo, fecha_inicio
)
SELECT id_emprendedor, 1, 'Arte Personalizado Único', 'Cuadros a tu medida desde $250 MXN',
       'https://nexcodemx.github.io/SanzaArt/SanzaArt.html', TRUE, CURRENT_DATE
FROM cuceimart.emprendedores WHERE slug_negocio = 'sanza-art'
UNION ALL
SELECT id_emprendedor, 2, 'Cursos En Línea Gratuitos', 'Aprende programación y tecnología con NEXCODE',
       'https://nexcodemx.github.io/NEXCODE/', TRUE, CURRENT_DATE
FROM cuceimart.emprendedores WHERE slug_negocio = 'nexcode';

-- Insertar cliente de ejemplo
INSERT INTO cuceimart.clientes (
    codigo_alumno, correo_udg, nombre, apellido_paterno, nombre_usuario,
    contrasena_hash, estado, correo_verificado, carrera, semestre
) VALUES (
    '218000001',
    '218000001@alumnos.udg.mx',
    'Ana', 'Martínez', 'ana_cucei',
    '$2b$12$HASH_EJEMPLO_CLIENTE',
    'activa', TRUE, 'Ingeniería en Computación', 6
);

-- Insertar productos de ejemplo
INSERT INTO cuceimart.productos (
    id_emprendedor, nombre, descripcion, descripcion_corta,
    categorias, categoria_principal, precio, precio_texto,
    slug, estado, es_destacado
)
SELECT
    e.id_emprendedor,
    'Cuadro Personalizado Pequeño',
    'Cuadro en lienzo de 30x30 cm. Puedes elegir tu imagen favorita, foto familiar o diseño artístico personalizado.',
    'Lienzo 30x30 cm. Totalmente personalizado.',
    ARRAY['decoraciones','regalos']::cuceimart.categoria_negocio[],
    'decoraciones',
    350.00, '$350 MXN', 'cuadro-personalizado-pequeno', 'activo', TRUE
FROM cuceimart.emprendedores e WHERE e.slug_negocio = 'sanza-art'
UNION ALL
SELECT
    e.id_emprendedor,
    'Cuadro Personalizado Grande',
    'Cuadro en lienzo de 60x90 cm. Alta resolución, acabado profesional.',
    'Lienzo 60x90 cm. Alta calidad.',
    ARRAY['decoraciones','regalos']::cuceimart.categoria_negocio[],
    'decoraciones',
    850.00, '$850 MXN', 'cuadro-personalizado-grande', 'activo', FALSE
FROM cuceimart.emprendedores e WHERE e.slug_negocio = 'sanza-art'
UNION ALL
SELECT
    e.id_emprendedor,
    'Curso de Python Básico',
    'Aprende Python desde cero con proyectos prácticos. Incluye certificado de finalización.',
    'Curso en línea con certificado incluido.',
    ARRAY['educacion','tecnologia']::cuceimart.categoria_negocio[],
    'educacion',
    0.00, 'Acceso Gratuito', 'curso-python-basico', 'activo', TRUE
FROM cuceimart.emprendedores e WHERE e.slug_negocio = 'nexcode'
UNION ALL
SELECT
    e.id_emprendedor,
    'Almuerzo del Día',
    'Platillo principal + postre + agua. Menú cambia cada día de lunes a viernes.',
    'Menú completo del día.',
    ARRAY['comida']::cuceimart.categoria_negocio[],
    'comida',
    65.00, '$65 MXN', 'almuerzo-del-dia', 'activo', FALSE
FROM cuceimart.emprendedores e WHERE e.slug_negocio = 'cocina-universitaria';

-- Insertar reseña de ejemplo
INSERT INTO cuceimart.resenas (
    id_cliente, id_emprendedor, calificacion, titulo, comentario, aprobado
)
SELECT
    c.id_cliente,
    e.id_emprendedor,
    5, '¡Arte increíble!',
    'Pedí un cuadro de mi mascota y quedó hermoso. Muy buena calidad y entrega puntual. 100% recomendado.',
    TRUE
FROM cuceimart.clientes c, cuceimart.emprendedores e
WHERE c.nombre_usuario = 'ana_cucei' AND e.slug_negocio = 'sanza-art';

-- =============================================================================
-- FIN DEL DDL - CUCEI MART v1.0
-- =============================================================================
