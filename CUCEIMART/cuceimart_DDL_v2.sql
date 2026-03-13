-- =============================================================================
-- CUCEI MART - Base de Datos PostgreSQL
-- Desarrollado por: NEXCODE
-- Versión: 2.0 | Fecha: 2025-11-01
-- Descripción: Base de datos integral para la plataforma e-commerce universitaria
-- Compatible con: PostgreSQL 14+
-- Servidor objetivo: Raspberry Pi (Raspbian/Ubuntu) / Docker / DBeaver
-- =============================================================================

-- -----------------------------------------------------------------------------
-- EXTENSIONES REQUERIDAS
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

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

CREATE TYPE cuceimart.estado_cuenta AS ENUM (
    'activa',
    'inactiva',
    'suspendida',
    'pendiente_verificacion',
    'bloqueada'
);

CREATE TYPE cuceimart.estado_producto AS ENUM (
    'activo',
    'inactivo',
    'agotado',
    'en_revision',
    'eliminado'
);

CREATE TYPE cuceimart.nivel_membresia AS ENUM (
    'basico',
    'estandar',
    'premium',
    'destacado'
);

CREATE TYPE media.tipo_media AS ENUM (
    'logo',
    'banner',
    'producto',
    'perfil',
    'galeria',
    'documento'
);

CREATE TYPE cuceimart.estado_verificacion AS ENUM (
    'pendiente',
    'en_revision',
    'aprobado',
    'rechazado',
    'expirado'
);

-- =============================================================================
-- SECCIÓN 2: SECUENCIAS (deben crearse ANTES de las tablas que las usan)
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS cuceimart.seq_verificacion
    START 1000
    INCREMENT 1
    NO CYCLE;

-- =============================================================================
-- SECCIÓN 3: TABLA DE ROLES Y PRIVILEGIOS
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
    acceso_panel_emp    BOOLEAN         NOT NULL DEFAULT FALSE,
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

INSERT INTO cuceimart.roles
    (nombre_rol, descripcion, puede_leer, puede_escribir, puede_editar,
     puede_eliminar, acceso_admin, acceso_estadisticas, acceso_panel_emp)
VALUES
    ('superadmin',    'Administrador total del sistema. Acceso completo.',
     TRUE, TRUE, TRUE, TRUE,  TRUE,  TRUE,  TRUE),
    ('admin',         'Administrador operativo. Gestion sin acceso a config critica.',
     TRUE, TRUE, TRUE, TRUE,  TRUE,  TRUE,  FALSE),
    ('emprendedor',   'Dueno de emprendimiento. Gestiona su propio negocio.',
     TRUE, TRUE, TRUE, FALSE, FALSE, TRUE,  TRUE),
    ('cliente',       'Alumno registrado. Puede buscar, comentar y calificar.',
     TRUE, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE),
    ('observador_ia', 'Cuenta de solo lectura para la IA. Sin escritura. Anti SQL-Injection.',
     TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE),
    ('moderador',     'Puede revisar contenido y gestionar reportes.',
     TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE);

-- =============================================================================
-- SECCIÓN 4: USUARIOS CLIENTES (ALUMNOS UDG)
-- =============================================================================

CREATE TABLE IF NOT EXISTS cuceimart.clientes (
    id_cliente          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Datos academicos
    codigo_alumno       VARCHAR(20)     NOT NULL UNIQUE,
    correo_udg          VARCHAR(120)    NOT NULL UNIQUE
                            CHECK (correo_udg LIKE '%@alumnos.udg.mx'),
    -- Datos personales
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
    -- Estado
    id_rol              INT             NOT NULL DEFAULT 4
                            REFERENCES cuceimart.roles(id_rol),
    estado              cuceimart.estado_cuenta
                            NOT NULL DEFAULT 'pendiente_verificacion',
    correo_verificado   BOOLEAN         NOT NULL DEFAULT FALSE,
    -- Preferencias
    avatar_url          TEXT,
    carrera             VARCHAR(100),
    semestre            SMALLINT        CHECK (semestre BETWEEN 1 AND 15),
    departamento        VARCHAR(100),
    -- Auditoria
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    ultimo_acceso       TIMESTAMPTZ,
    ip_registro         INET,
    -- Estadisticas de actividad
    total_comentarios   INT             NOT NULL DEFAULT 0,
    total_resenas       INT             NOT NULL DEFAULT 0,
    CONSTRAINT ck_codigo_alumno_formato
        CHECK (codigo_alumno ~ '^\d{6,10}$')
);

-- =============================================================================
-- SECCIÓN 5: USUARIOS EMPRENDEDORES
-- =============================================================================

-- NOTA: num_verificacion se genera via trigger (no via DEFAULT con NEXTVAL
--       dentro del CREATE TABLE, ya que PostgreSQL no lo permite directamente
--       al referenciar una secuencia con expresiones compuestas en DEFAULT).

CREATE TABLE IF NOT EXISTS cuceimart.emprendedores (
    id_emprendedor      UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Datos academicos/personales del titular
    codigo_alumno       VARCHAR(20)     UNIQUE,
    correo_udg          VARCHAR(120)    UNIQUE,
    correo_contacto     VARCHAR(120)    NOT NULL UNIQUE,
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
    slug_negocio        VARCHAR(120)    NOT NULL UNIQUE,
    descripcion_corta   VARCHAR(280),
    descripcion_larga   TEXT,
    -- Numero de verificacion exclusivo CUCEI MART (generado por trigger)
    num_verificacion    VARCHAR(30)     UNIQUE,
    -- Categorias del negocio
    categorias          cuceimart.categoria_negocio[]
                            NOT NULL DEFAULT '{}',
    categoria_principal cuceimart.categoria_negocio  NOT NULL,
    -- Contacto
    whatsapp            VARCHAR(20),
    instagram           VARCHAR(120),
    facebook            VARCHAR(200),
    tiktok              VARCHAR(120),
    website_externo     VARCHAR(300),
    telefono            VARCHAR(20),
    -- Ubicacion en campus
    edificio_id         VARCHAR(10),
    zona_id             VARCHAR(60),
    mapa_x              DECIMAL(5,4)    CHECK (mapa_x BETWEEN 0 AND 1),
    mapa_y              DECIMAL(5,4)    CHECK (mapa_y BETWEEN 0 AND 1),
    -- Estado y membresia
    id_rol              INT             NOT NULL DEFAULT 3
                            REFERENCES cuceimart.roles(id_rol),
    nivel_membresia     cuceimart.nivel_membresia
                            NOT NULL DEFAULT 'basico',
    estado              cuceimart.estado_cuenta
                            NOT NULL DEFAULT 'pendiente_verificacion',
    estado_verificacion cuceimart.estado_verificacion
                            NOT NULL DEFAULT 'pendiente',
    correo_verificado   BOOLEAN         NOT NULL DEFAULT FALSE,
    -- Clave de privilegios para panel web del emprendedor
    api_key_panel       UUID            NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    api_key_expira      TIMESTAMPTZ     NOT NULL
                            DEFAULT (NOW() + INTERVAL '1 year'),
    -- Reputacion calculada por triggers
    reputacion_promedio DECIMAL(3,2)    NOT NULL DEFAULT 0.00
                            CHECK (reputacion_promedio BETWEEN 0 AND 5),
    total_resenas       INT             NOT NULL DEFAULT 0,
    total_ventas        INT             NOT NULL DEFAULT 0,
    total_productos     INT             NOT NULL DEFAULT 0,
    -- Datos financieros
    precio_minimo       DECIMAL(10,2)   CHECK (precio_minimo >= 0),
    precio_maximo       DECIMAL(10,2)   CHECK (precio_maximo >= 0),
    precio_texto        VARCHAR(60),
    moneda              CHAR(3)         NOT NULL DEFAULT 'MXN',
    -- Destacado
    es_destacado        BOOLEAN         NOT NULL DEFAULT FALSE,
    orden_destacado     SMALLINT        DEFAULT 0,
    -- Auditoria
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    ultimo_acceso       TIMESTAMPTZ,
    ip_registro         INET,
    -- Metadatos SEO
    meta_titulo         VARCHAR(120),
    meta_descripcion    VARCHAR(280),
    palabras_clave      TEXT[],
    CONSTRAINT ck_precios_validos CHECK (
        precio_maximo IS NULL
        OR precio_minimo IS NULL
        OR precio_maximo >= precio_minimo
    )
);

-- Trigger para generar num_verificacion automaticamente al insertar
CREATE OR REPLACE FUNCTION cuceimart.fn_generar_num_verificacion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.num_verificacion IS NULL THEN
        NEW.num_verificacion := 'CM-'
            || TO_CHAR(NOW(), 'YYYY')
            || '-'
            || LPAD(NEXTVAL('cuceimart.seq_verificacion')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_emprendedores_num_verificacion
    BEFORE INSERT ON cuceimart.emprendedores
    FOR EACH ROW EXECUTE FUNCTION cuceimart.fn_generar_num_verificacion();

-- =============================================================================
-- SECCIÓN 6: EMPRENDEDORES DESTACADOS
-- =============================================================================

CREATE TABLE IF NOT EXISTS cuceimart.emprendedores_destacados (
    id_destacado        SERIAL          PRIMARY KEY,
    id_emprendedor      UUID            NOT NULL
                            REFERENCES cuceimart.emprendedores(id_emprendedor)
                            ON DELETE CASCADE,
    posicion_banner     SMALLINT        NOT NULL DEFAULT 1,
    fecha_inicio        DATE            NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin           DATE,
    titulo_promocional  VARCHAR(120),
    descripcion_promo   VARCHAR(280),
    imagen_banner_url   TEXT,
    url_destino         TEXT,
    clics_banner        INT             NOT NULL DEFAULT 0,
    impresiones         INT             NOT NULL DEFAULT 0,
    aprobado_por        INT             REFERENCES cuceimart.roles(id_rol),
    notas_admin         TEXT,
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    activo              BOOLEAN         NOT NULL DEFAULT TRUE,
    CONSTRAINT ck_fechas_destacado CHECK (
        fecha_fin IS NULL OR fecha_fin > fecha_inicio
    )
);

-- =============================================================================
-- SECCIÓN 7: MEDIA / IMAGENES
-- =============================================================================

CREATE TABLE IF NOT EXISTS media.archivos (
    id_archivo          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    entidad_tipo        VARCHAR(30)     NOT NULL,
    entidad_id          UUID            NOT NULL,
    tipo                media.tipo_media NOT NULL,
    nombre_original     VARCHAR(255)    NOT NULL,
    nombre_almacenado   VARCHAR(255)    NOT NULL UNIQUE,
    ruta_relativa       TEXT            NOT NULL,
    url_publica         TEXT,
    url_thumbnail       TEXT,
    mime_type           VARCHAR(80)     NOT NULL,
    tamano_bytes        BIGINT          NOT NULL,
    ancho_px            INT,
    alto_px             INT,
    es_principal        BOOLEAN         NOT NULL DEFAULT FALSE,
    orden               SMALLINT        NOT NULL DEFAULT 0,
    activo              BOOLEAN         NOT NULL DEFAULT TRUE,
    subido_por          UUID,
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_tamano_max CHECK (tamano_bytes <= 52428800)
);

-- =============================================================================
-- SECCIÓN 8: PRODUCTOS / CATALOGO
-- =============================================================================

CREATE TABLE IF NOT EXISTS cuceimart.productos (
    id_producto         UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_emprendedor      UUID            NOT NULL
                            REFERENCES cuceimart.emprendedores(id_emprendedor)
                            ON DELETE CASCADE,
    nombre              VARCHAR(200)    NOT NULL,
    descripcion         TEXT,
    descripcion_corta   VARCHAR(280),
    categorias          cuceimart.categoria_negocio[]
                            NOT NULL DEFAULT '{}',
    categoria_principal cuceimart.categoria_negocio  NOT NULL,
    precio              DECIMAL(10,2)   NOT NULL CHECK (precio >= 0),
    precio_anterior     DECIMAL(10,2)   CHECK (precio_anterior >= 0),
    moneda              CHAR(3)         NOT NULL DEFAULT 'MXN',
    precio_texto        VARCHAR(60),
    tiene_descuento     BOOLEAN         NOT NULL DEFAULT FALSE,
    porcentaje_descuento SMALLINT       CHECK (porcentaje_descuento BETWEEN 0 AND 100),
    disponible          BOOLEAN         NOT NULL DEFAULT TRUE,
    cantidad_stock      INT             DEFAULT NULL,
    slug                VARCHAR(200)    NOT NULL,
    palabras_clave      TEXT[],
    estado              cuceimart.estado_producto
                            NOT NULL DEFAULT 'en_revision',
    es_destacado        BOOLEAN         NOT NULL DEFAULT FALSE,
    vistas              INT             NOT NULL DEFAULT 0,
    total_vendido       INT             NOT NULL DEFAULT 0,
    calificacion_prom   DECIMAL(3,2)    NOT NULL DEFAULT 0.00
                            CHECK (calificacion_prom BETWEEN 0 AND 5),
    total_resenas       INT             NOT NULL DEFAULT 0,
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_producto_slug_emp UNIQUE (id_emprendedor, slug)
);

-- =============================================================================
-- SECCIÓN 9: COMENTARIOS Y RESEÑAS
-- =============================================================================

CREATE TABLE IF NOT EXISTS cuceimart.resenas (
    id_resena           UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_cliente          UUID            NOT NULL
                            REFERENCES cuceimart.clientes(id_cliente)
                            ON DELETE CASCADE,
    id_emprendedor      UUID            NOT NULL
                            REFERENCES cuceimart.emprendedores(id_emprendedor)
                            ON DELETE CASCADE,
    id_producto         UUID
                            REFERENCES cuceimart.productos(id_producto)
                            ON DELETE SET NULL,
    calificacion        SMALLINT        NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
    titulo              VARCHAR(100),
    comentario          TEXT            NOT NULL
                            CHECK (LENGTH(TRIM(comentario)) >= 10),
    aprobado            BOOLEAN         NOT NULL DEFAULT FALSE,
    moderado_por        INT             REFERENCES cuceimart.roles(id_rol),
    razon_rechazo       TEXT,
    total_utiles        INT             NOT NULL DEFAULT 0,
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    editado             BOOLEAN         NOT NULL DEFAULT FALSE,
    ip_origen           INET,
    CONSTRAINT uq_resena_cliente_emp UNIQUE (id_cliente, id_emprendedor)
);

CREATE TABLE IF NOT EXISTS cuceimart.respuestas_resenas (
    id_respuesta        UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_resena           UUID            NOT NULL UNIQUE
                            REFERENCES cuceimart.resenas(id_resena)
                            ON DELETE CASCADE,
    id_emprendedor      UUID            NOT NULL
                            REFERENCES cuceimart.emprendedores(id_emprendedor)
                            ON DELETE CASCADE,
    respuesta           TEXT            NOT NULL
                            CHECK (LENGTH(TRIM(respuesta)) >= 5),
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    actualizado_en      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SECCIÓN 10: ESTADISTICAS DE EMPRENDEDORES
-- =============================================================================

CREATE TABLE IF NOT EXISTS estadisticas.visitas_perfil (
    id_visita           BIGSERIAL       PRIMARY KEY,
    id_emprendedor      UUID            NOT NULL
                            REFERENCES cuceimart.emprendedores(id_emprendedor)
                            ON DELETE CASCADE,
    fecha               DATE            NOT NULL DEFAULT CURRENT_DATE,
    hora                TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    id_cliente          UUID
                            REFERENCES cuceimart.clientes(id_cliente)
                            ON DELETE SET NULL,
    ip_visitante        INET,
    user_agent          TEXT,
    referer             TEXT,
    dispositivo         VARCHAR(20),
    pais                CHAR(2),
    ciudad              VARCHAR(80)
);

CREATE TABLE IF NOT EXISTS estadisticas.resumen_diario (
    id                  BIGSERIAL       PRIMARY KEY,
    id_emprendedor      UUID            NOT NULL
                            REFERENCES cuceimart.emprendedores(id_emprendedor)
                            ON DELETE CASCADE,
    fecha               DATE            NOT NULL,
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

CREATE TABLE IF NOT EXISTS estadisticas.clics_contacto (
    id_clic             BIGSERIAL       PRIMARY KEY,
    id_emprendedor      UUID            NOT NULL
                            REFERENCES cuceimart.emprendedores(id_emprendedor)
                            ON DELETE CASCADE,
    tipo_clic           VARCHAR(30)     NOT NULL
                            CHECK (tipo_clic IN (
                                'whatsapp','instagram','facebook',
                                'tiktok','website','mapa',
                                'ver_negocio','banner'
                            )),
    fecha               TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    id_cliente          UUID
                            REFERENCES cuceimart.clientes(id_cliente)
                            ON DELETE SET NULL,
    ip_origen           INET,
    id_producto         UUID
                            REFERENCES cuceimart.productos(id_producto)
                            ON DELETE SET NULL
);

-- =============================================================================
-- SECCIÓN 11: REPORTES Y MODERACION
-- =============================================================================

CREATE TABLE IF NOT EXISTS cuceimart.reportes (
    id_reporte          SERIAL          PRIMARY KEY,
    id_cliente          UUID
                            REFERENCES cuceimart.clientes(id_cliente)
                            ON DELETE SET NULL,
    entidad_tipo        VARCHAR(30)     NOT NULL
                            CHECK (entidad_tipo IN ('emprendedor','producto','resena')),
    entidad_id          UUID            NOT NULL,
    motivo              VARCHAR(50)     NOT NULL,
    descripcion         TEXT,
    estado              VARCHAR(20)     NOT NULL DEFAULT 'pendiente'
                            CHECK (estado IN ('pendiente','en_revision','resuelto','descartado')),
    resuelto_por        INT             REFERENCES cuceimart.roles(id_rol),
    resolucion          TEXT,
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    resuelto_en         TIMESTAMPTZ
);

-- =============================================================================
-- SECCIÓN 12: NOTIFICACIONES
-- =============================================================================

CREATE TABLE IF NOT EXISTS cuceimart.notificaciones (
    id_notificacion     BIGSERIAL       PRIMARY KEY,
    id_cliente          UUID
                            REFERENCES cuceimart.clientes(id_cliente)
                            ON DELETE CASCADE,
    id_emprendedor      UUID
                            REFERENCES cuceimart.emprendedores(id_emprendedor)
                            ON DELETE CASCADE,
    tipo                VARCHAR(40)     NOT NULL,
    titulo              VARCHAR(120)    NOT NULL,
    mensaje             TEXT            NOT NULL,
    url_accion          TEXT,
    leida               BOOLEAN         NOT NULL DEFAULT FALSE,
    leida_en            TIMESTAMPTZ,
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_un_destinatario CHECK (
        (id_cliente IS NOT NULL AND id_emprendedor IS NULL) OR
        (id_cliente IS NULL     AND id_emprendedor IS NOT NULL)
    )
);

-- =============================================================================
-- SECCIÓN 13: SESIONES Y TOKENS DE AUTENTICACION
-- =============================================================================

CREATE TABLE IF NOT EXISTS cuceimart.sesiones (
    id_sesion           UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    entidad_tipo        VARCHAR(20)     NOT NULL
                            CHECK (entidad_tipo IN ('cliente','emprendedor')),
    entidad_id          UUID            NOT NULL,
    refresh_token       TEXT            NOT NULL UNIQUE,
    expira_en           TIMESTAMPTZ     NOT NULL
                            DEFAULT (NOW() + INTERVAL '30 days'),
    ip_origen           INET,
    user_agent          TEXT,
    dispositivo         VARCHAR(20),
    activa              BOOLEAN         NOT NULL DEFAULT TRUE,
    creado_en           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    ultimo_uso          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SECCIÓN 14: INDICES PARA RENDIMIENTO
-- =============================================================================

-- Clientes
CREATE INDEX IF NOT EXISTS idx_clientes_codigo
    ON cuceimart.clientes(codigo_alumno);
CREATE INDEX IF NOT EXISTS idx_clientes_correo
    ON cuceimart.clientes(correo_udg);
CREATE INDEX IF NOT EXISTS idx_clientes_estado
    ON cuceimart.clientes(estado);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre_trgm
    ON cuceimart.clientes USING GIN (nombre gin_trgm_ops);

-- Emprendedores
CREATE INDEX IF NOT EXISTS idx_emp_slug
    ON cuceimart.emprendedores(slug_negocio);
CREATE INDEX IF NOT EXISTS idx_emp_estado
    ON cuceimart.emprendedores(estado);
CREATE INDEX IF NOT EXISTS idx_emp_destacado
    ON cuceimart.emprendedores(es_destacado) WHERE es_destacado = TRUE;
CREATE INDEX IF NOT EXISTS idx_emp_categorias
    ON cuceimart.emprendedores USING GIN(categorias);
CREATE INDEX IF NOT EXISTS idx_emp_nombre_trgm
    ON cuceimart.emprendedores USING GIN (nombre_negocio gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_emp_reputacion
    ON cuceimart.emprendedores(reputacion_promedio DESC);
CREATE INDEX IF NOT EXISTS idx_emp_verificacion
    ON cuceimart.emprendedores(estado_verificacion);

-- Productos
CREATE INDEX IF NOT EXISTS idx_prod_emprendedor
    ON cuceimart.productos(id_emprendedor);
CREATE INDEX IF NOT EXISTS idx_prod_categorias
    ON cuceimart.productos USING GIN(categorias);
CREATE INDEX IF NOT EXISTS idx_prod_estado
    ON cuceimart.productos(estado);
CREATE INDEX IF NOT EXISTS idx_prod_precio
    ON cuceimart.productos(precio);
CREATE INDEX IF NOT EXISTS idx_prod_nombre_trgm
    ON cuceimart.productos USING GIN (nombre gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_prod_destacado
    ON cuceimart.productos(es_destacado) WHERE es_destacado = TRUE;

-- Resenas
CREATE INDEX IF NOT EXISTS idx_resenas_emprendedor
    ON cuceimart.resenas(id_emprendedor);
CREATE INDEX IF NOT EXISTS idx_resenas_cliente
    ON cuceimart.resenas(id_cliente);
CREATE INDEX IF NOT EXISTS idx_resenas_calificacion
    ON cuceimart.resenas(calificacion);
CREATE INDEX IF NOT EXISTS idx_resenas_aprobadas
    ON cuceimart.resenas(aprobado) WHERE aprobado = TRUE;

-- Estadisticas
CREATE INDEX IF NOT EXISTS idx_visitas_emp_fecha
    ON estadisticas.visitas_perfil(id_emprendedor, fecha);
CREATE INDEX IF NOT EXISTS idx_resumen_emp_fecha
    ON estadisticas.resumen_diario(id_emprendedor, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_clics_emp_tipo
    ON estadisticas.clics_contacto(id_emprendedor, tipo_clic);

-- Media
CREATE INDEX IF NOT EXISTS idx_media_entidad
    ON media.archivos(entidad_tipo, entidad_id);
CREATE INDEX IF NOT EXISTS idx_media_tipo
    ON media.archivos(tipo);
CREATE INDEX IF NOT EXISTS idx_media_principal
    ON media.archivos(es_principal) WHERE es_principal = TRUE;

-- Sesiones
CREATE INDEX IF NOT EXISTS idx_sesiones_entidad
    ON cuceimart.sesiones(entidad_tipo, entidad_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_activas
    ON cuceimart.sesiones(activa, expira_en) WHERE activa = TRUE;

-- =============================================================================
-- SECCIÓN 15: VISTAS PARA CONSULTAS FRECUENTES
-- =============================================================================

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
    e.precio_texto,
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
INNER JOIN cuceimart.emprendedores e
    ON e.id_emprendedor = ed.id_emprendedor
WHERE ed.activo = TRUE
  AND (ed.fecha_fin IS NULL OR ed.fecha_fin >= CURRENT_DATE)
  AND e.estado = 'activa'
ORDER BY ed.posicion_banner ASC;

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

CREATE OR REPLACE VIEW estadisticas.v_dashboard_emprendedor AS
SELECT
    e.id_emprendedor,
    e.nombre_negocio,
    e.reputacion_promedio,
    e.total_resenas,
    e.total_productos,
    COALESCE(SUM(rd.visitas_totales), 0)  AS visitas_30_dias,
    COALESCE(SUM(rd.visitas_unicas), 0)   AS visitas_unicas_30_dias,
    COALESCE(SUM(rd.clics_whatsapp), 0)   AS clics_whatsapp_30_dias,
    COALESCE(SUM(rd.clics_instagram), 0)  AS clics_instagram_30_dias,
    COALESCE(SUM(rd.clics_website), 0)    AS clics_website_30_dias,
    COALESCE(SUM(rd.nuevas_resenas), 0)   AS resenas_30_dias
FROM cuceimart.emprendedores e
LEFT JOIN estadisticas.resumen_diario rd ON (
    rd.id_emprendedor = e.id_emprendedor
    AND rd.fecha >= CURRENT_DATE - INTERVAL '30 days'
)
GROUP BY
    e.id_emprendedor,
    e.nombre_negocio,
    e.reputacion_promedio,
    e.total_resenas,
    e.total_productos;

-- =============================================================================
-- SECCIÓN 16: FUNCIONES Y TRIGGERS
-- =============================================================================

-- Funcion: Actualizar campo actualizado_en automaticamente
CREATE OR REPLACE FUNCTION cuceimart.fn_actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funcion: Recalcular reputacion del emprendedor al insertar/actualizar resena
CREATE OR REPLACE FUNCTION cuceimart.fn_actualizar_reputacion()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE cuceimart.emprendedores
    SET
        reputacion_promedio = (
            SELECT COALESCE(ROUND(AVG(calificacion::DECIMAL), 2), 0.00)
            FROM cuceimart.resenas
            WHERE id_emprendedor = NEW.id_emprendedor
              AND aprobado = TRUE
        ),
        total_resenas = (
            SELECT COUNT(*)
            FROM cuceimart.resenas
            WHERE id_emprendedor = NEW.id_emprendedor
              AND aprobado = TRUE
        ),
        actualizado_en = NOW()
    WHERE id_emprendedor = NEW.id_emprendedor;

    UPDATE cuceimart.clientes
    SET
        total_resenas = (
            SELECT COUNT(*)
            FROM cuceimart.resenas
            WHERE id_cliente = NEW.id_cliente
        ),
        actualizado_en = NOW()
    WHERE id_cliente = NEW.id_cliente;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funcion: Actualizar total_productos del emprendedor
CREATE OR REPLACE FUNCTION cuceimart.fn_actualizar_total_productos()
RETURNS TRIGGER AS $$
DECLARE
    v_id_emprendedor UUID;
BEGIN
    -- Compatibilidad con DELETE (usa OLD) e INSERT/UPDATE (usa NEW)
    IF TG_OP = 'DELETE' THEN
        v_id_emprendedor := OLD.id_emprendedor;
    ELSE
        v_id_emprendedor := NEW.id_emprendedor;
    END IF;

    UPDATE cuceimart.emprendedores
    SET
        total_productos = (
            SELECT COUNT(*)
            FROM cuceimart.productos
            WHERE id_emprendedor = v_id_emprendedor
              AND estado = 'activo'
        ),
        actualizado_en = NOW()
    WHERE id_emprendedor = v_id_emprendedor;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funcion: Generar resumen diario de estadisticas
CREATE OR REPLACE FUNCTION estadisticas.fn_generar_resumen_diario(
    p_fecha DATE DEFAULT CURRENT_DATE - 1
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO estadisticas.resumen_diario (
        id_emprendedor,
        fecha,
        visitas_totales,
        visitas_unicas,
        clics_whatsapp,
        clics_instagram,
        clics_website,
        clics_productos,
        nuevas_resenas,
        reputacion_dia
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
        SELECT
            id_emprendedor,
            COUNT(*)                        AS visitas_totales,
            COUNT(DISTINCT ip_visitante)    AS visitas_unicas
        FROM estadisticas.visitas_perfil
        WHERE fecha = p_fecha
        GROUP BY id_emprendedor
    ) v ON v.id_emprendedor = e.id_emprendedor
    LEFT JOIN (
        SELECT
            id_emprendedor,
            SUM(CASE WHEN tipo_clic = 'whatsapp'    THEN 1 ELSE 0 END) AS clics_whatsapp,
            SUM(CASE WHEN tipo_clic = 'instagram'   THEN 1 ELSE 0 END) AS clics_instagram,
            SUM(CASE WHEN tipo_clic = 'website'     THEN 1 ELSE 0 END) AS clics_website,
            SUM(CASE WHEN tipo_clic = 'ver_negocio' THEN 1 ELSE 0 END) AS clics_productos
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
    ON CONFLICT (id_emprendedor, fecha) DO UPDATE SET
        visitas_totales  = EXCLUDED.visitas_totales,
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
-- SECCIÓN 17: TRIGGERS
-- =============================================================================

CREATE TRIGGER trg_clientes_ts
    BEFORE UPDATE ON cuceimart.clientes
    FOR EACH ROW EXECUTE FUNCTION cuceimart.fn_actualizar_timestamp();

CREATE TRIGGER trg_emprendedores_ts
    BEFORE UPDATE ON cuceimart.emprendedores
    FOR EACH ROW EXECUTE FUNCTION cuceimart.fn_actualizar_timestamp();

CREATE TRIGGER trg_productos_ts
    BEFORE UPDATE ON cuceimart.productos
    FOR EACH ROW EXECUTE FUNCTION cuceimart.fn_actualizar_timestamp();

CREATE TRIGGER trg_resenas_ts
    BEFORE UPDATE ON cuceimart.resenas
    FOR EACH ROW EXECUTE FUNCTION cuceimart.fn_actualizar_timestamp();

CREATE TRIGGER trg_respuestas_resenas_ts
    BEFORE UPDATE ON cuceimart.respuestas_resenas
    FOR EACH ROW EXECUTE FUNCTION cuceimart.fn_actualizar_timestamp();

CREATE TRIGGER trg_destacados_ts
    BEFORE UPDATE ON cuceimart.emprendedores_destacados
    FOR EACH ROW EXECUTE FUNCTION cuceimart.fn_actualizar_timestamp();

CREATE TRIGGER trg_resena_reputacion
    AFTER INSERT OR UPDATE OF calificacion, aprobado ON cuceimart.resenas
    FOR EACH ROW EXECUTE FUNCTION cuceimart.fn_actualizar_reputacion();

CREATE TRIGGER trg_productos_conteo
    AFTER INSERT OR UPDATE OF estado ON cuceimart.productos
    FOR EACH ROW EXECUTE FUNCTION cuceimart.fn_actualizar_total_productos();

CREATE TRIGGER trg_productos_conteo_delete
    AFTER DELETE ON cuceimart.productos
    FOR EACH ROW EXECUTE FUNCTION cuceimart.fn_actualizar_total_productos();

-- =============================================================================
-- SECCIÓN 18: USUARIOS DE BASE DE DATOS
-- Ejecutar conectado como superusuario (postgres).
-- Reemplaza 'cuceimart' por el nombre real de tu base de datos en DBeaver.
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cuceimart_admin') THEN
        CREATE ROLE cuceimart_admin WITH LOGIN PASSWORD 'CambiarPasswordAdmin123!';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cuceimart_ia_readonly') THEN
        CREATE ROLE cuceimart_ia_readonly WITH LOGIN PASSWORD 'CambiarPasswordIA456!';
    END IF;
END $$;

-- Permisos administrador
GRANT CONNECT ON DATABASE cuceimart TO cuceimart_admin;
GRANT ALL PRIVILEGES ON SCHEMA cuceimart    TO cuceimart_admin;
GRANT ALL PRIVILEGES ON SCHEMA estadisticas TO cuceimart_admin;
GRANT ALL PRIVILEGES ON SCHEMA media        TO cuceimart_admin;
GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA cuceimart    TO cuceimart_admin;
GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA estadisticas TO cuceimart_admin;
GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA media        TO cuceimart_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA cuceimart    TO cuceimart_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA estadisticas TO cuceimart_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA cuceimart    TO cuceimart_admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA estadisticas TO cuceimart_admin;

-- Permisos IA (solo lectura — anti SQL Injection)
GRANT CONNECT  ON DATABASE cuceimart TO cuceimart_ia_readonly;
GRANT USAGE    ON SCHEMA cuceimart    TO cuceimart_ia_readonly;
GRANT USAGE    ON SCHEMA estadisticas TO cuceimart_ia_readonly;
GRANT USAGE    ON SCHEMA media        TO cuceimart_ia_readonly;
GRANT SELECT   ON ALL TABLES IN SCHEMA cuceimart    TO cuceimart_ia_readonly;
GRANT SELECT   ON ALL TABLES IN SCHEMA estadisticas TO cuceimart_ia_readonly;
GRANT SELECT   ON ALL TABLES IN SCHEMA media        TO cuceimart_ia_readonly;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE
    ON ALL TABLES IN SCHEMA cuceimart    FROM cuceimart_ia_readonly;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE
    ON ALL TABLES IN SCHEMA estadisticas FROM cuceimart_ia_readonly;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE
    ON ALL TABLES IN SCHEMA media        FROM cuceimart_ia_readonly;

-- =============================================================================
-- SECCIÓN 19: DATOS DE EJEMPLO
-- Para eliminarlos antes del lanzamiento, ejecuta la Sección 20.
-- =============================================================================

INSERT INTO cuceimart.emprendedores (
    codigo_alumno, correo_contacto,
    nombre, apellido_paterno, nombre_usuario,
    contrasena_hash,
    nombre_negocio, slug_negocio,
    descripcion_corta, descripcion_larga,
    categorias, categoria_principal,
    whatsapp, instagram, website_externo,
    edificio_id, zona_id, mapa_x, mapa_y,
    estado, estado_verificacion, correo_verificado,
    precio_minimo, precio_maximo, precio_texto,
    es_destacado, nivel_membresia
) VALUES
(
    '224786978',
    'sanzaart@gmail.com',
    'Itzamara', 'Sanchez', 'sanza_art',
    '$2b$12$HASH_EJEMPLO_SANZA_NO_USAR_EN_PROD',
    'SANZA ART', 'sanza-art',
    'Cuadros personalizados artisticos unicos para ti.',
    'SANZA ART se especializa en cuadros personalizados. Ideal para regalos y decoracion.',
    ARRAY['decoraciones','regalos']::cuceimart.categoria_negocio[],
    'decoraciones',
    '523343408028', 'https://www.instagram.com/sanza.art/',
    'https://nexcodemx.github.io/SanzaArt/SanzaArt.html',
    'U', 'lab_ingenierias', 0.7800, 0.4000,
    'activa', 'aprobado', TRUE,
    250.00, 1500.00, 'Desde $250 MXN',
    TRUE, 'destacado'
),
(
    NULL,
    'nexcodemx@gmail.com',
    'Demian', 'Fernandez', 'nexcode_mx',
    '$2b$12$HASH_EJEMPLO_NEXCODE_NO_USAR_EN_PROD',
    'NEXCODE', 'nexcode',
    'Cursos en linea y desarrollo web profesional.',
    'NEXCODE ofrece cursos en linea, desarrollo web y soluciones digitales para emprendedores universitarios.',
    ARRAY['educacion','tecnologia','servicios']::cuceimart.categoria_negocio[],
    'educacion',
    '523343408028', 'https://www.instagram.com/NexCode_MX/',
    'https://nexcodemx.github.io/NEXCODE/',
    NULL, NULL, NULL, NULL,
    'activa', 'aprobado', TRUE,
    0.00, 5000.00, 'Acceso Gratuito / Desde $299 MXN',
    TRUE, 'premium'
),
(
    '219501234',
    'papeleria.cucei@gmail.com',
    'Carlos', 'Morales', 'papeleria_cucei',
    '$2b$12$HASH_EJEMPLO_PAPELERIA_NO_USAR_EN_PROD',
    'Papeleria Express CUCEI', 'papeleria-express-cucei',
    'Impresiones, copias, engargolados y material escolar.',
    'Tu papeleria de confianza dentro del campus CUCEI. Impresion laser, copias, engargolado y laminado.',
    ARRAY['servicios','papeleria']::cuceimart.categoria_negocio[],
    'servicios',
    '523312345678', NULL, NULL,
    'A', 'papelerias', 0.3500, 0.7000,
    'activa', 'aprobado', TRUE,
    0.20, 150.00, 'Desde $0.20 MXN',
    FALSE, 'estandar'
),
(
    '220987654',
    'cocinauniversitaria@gmail.com',
    'Valeria', 'Ramirez', 'cocina_uni_cucei',
    '$2b$12$HASH_EJEMPLO_COCINA_NO_USAR_EN_PROD',
    'Cocina Universitaria', 'cocina-universitaria',
    'Platillos caseros y saludables para la comunidad CUCEI.',
    'Comida casera, nutritiva y accesible para estudiantes. Menu semanal variado con opciones vegetarianas.',
    ARRAY['comida']::cuceimart.categoria_negocio[],
    'comida',
    '523398765432', NULL, NULL,
    'B', 'cafeteria_central', 0.5000, 0.6500,
    'activa', 'aprobado', TRUE,
    35.00, 120.00, 'Desde $35 MXN',
    FALSE, 'basico'
),
(
    '221456789',
    'techzone.cucei@gmail.com',
    'Rodrigo', 'Lopez', 'techzone_cucei',
    '$2b$12$HASH_EJEMPLO_TECHZONE_NO_USAR_EN_PROD',
    'TechZone CUCEI', 'techzone-cucei',
    'Accesorios tecnologicos y gadgets al mejor precio del campus.',
    'Fundas para celular, cables, cargadores, teclados, mouses y mas. Envios por campus.',
    ARRAY['tecnologia','accesorios']::cuceimart.categoria_negocio[],
    'tecnologia',
    '523356781234', NULL, NULL,
    'C', 'laboratorios_computo', 0.6000, 0.4500,
    'activa', 'aprobado', TRUE,
    50.00, 2000.00, 'Desde $50 MXN',
    FALSE, 'estandar'
);

-- Emprendedores destacados
INSERT INTO cuceimart.emprendedores_destacados (
    id_emprendedor, posicion_banner,
    titulo_promocional, descripcion_promo,
    url_destino, activo, fecha_inicio
)
SELECT
    id_emprendedor, 1,
    'Arte Personalizado Unico',
    'Cuadros a tu medida desde $250 MXN',
    'https://nexcodemx.github.io/SanzaArt/SanzaArt.html',
    TRUE, CURRENT_DATE
FROM cuceimart.emprendedores WHERE slug_negocio = 'sanza-art'
UNION ALL
SELECT
    id_emprendedor, 2,
    'Cursos En Linea Gratuitos',
    'Aprende programacion y tecnologia con NEXCODE',
    'https://nexcodemx.github.io/NEXCODE/',
    TRUE, CURRENT_DATE
FROM cuceimart.emprendedores WHERE slug_negocio = 'nexcode';

-- Cliente de ejemplo
INSERT INTO cuceimart.clientes (
    codigo_alumno, correo_udg,
    nombre, apellido_paterno, nombre_usuario,
    contrasena_hash, estado, correo_verificado,
    carrera, semestre
) VALUES (
    '218000001',
    '218000001@alumnos.udg.mx',
    'Ana', 'Martinez', 'ana_cucei',
    '$2b$12$HASH_EJEMPLO_CLIENTE_NO_USAR_EN_PROD',
    'activa', TRUE,
    'Ingenieria en Computacion', 6
);

-- Productos de ejemplo
INSERT INTO cuceimart.productos (
    id_emprendedor, nombre, descripcion, descripcion_corta,
    categorias, categoria_principal,
    precio, precio_texto, slug, estado, es_destacado
)
SELECT
    e.id_emprendedor,
    'Cuadro Personalizado Pequeno',
    'Cuadro en lienzo de 30x30 cm. Elige tu imagen favorita.',
    'Lienzo 30x30 cm. Totalmente personalizado.',
    ARRAY['decoraciones','regalos']::cuceimart.categoria_negocio[],
    'decoraciones',
    350.00, '$350 MXN', 'cuadro-personalizado-pequeno', 'activo', TRUE
FROM cuceimart.emprendedores e WHERE e.slug_negocio = 'sanza-art'
UNION ALL
SELECT
    e.id_emprendedor,
    'Cuadro Personalizado Grande',
    'Cuadro en lienzo de 60x90 cm. Alta resolucion, acabado profesional.',
    'Lienzo 60x90 cm. Alta calidad.',
    ARRAY['decoraciones','regalos']::cuceimart.categoria_negocio[],
    'decoraciones',
    850.00, '$850 MXN', 'cuadro-personalizado-grande', 'activo', FALSE
FROM cuceimart.emprendedores e WHERE e.slug_negocio = 'sanza-art'
UNION ALL
SELECT
    e.id_emprendedor,
    'Curso de Python Basico',
    'Aprende Python desde cero con proyectos practicos. Incluye certificado.',
    'Curso en linea con certificado incluido.',
    ARRAY['educacion','tecnologia']::cuceimart.categoria_negocio[],
    'educacion',
    0.00, 'Acceso Gratuito', 'curso-python-basico', 'activo', TRUE
FROM cuceimart.emprendedores e WHERE e.slug_negocio = 'nexcode'
UNION ALL
SELECT
    e.id_emprendedor,
    'Almuerzo del Dia',
    'Platillo principal + postre + agua. Menu cambia cada dia.',
    'Menu completo del dia.',
    ARRAY['comida']::cuceimart.categoria_negocio[],
    'comida',
    65.00, '$65 MXN', 'almuerzo-del-dia', 'activo', FALSE
FROM cuceimart.emprendedores e WHERE e.slug_negocio = 'cocina-universitaria';

-- Resena de ejemplo
INSERT INTO cuceimart.resenas (
    id_cliente, id_emprendedor,
    calificacion, titulo, comentario, aprobado
)
SELECT
    c.id_cliente,
    e.id_emprendedor,
    5,
    'Arte increible',
    'Pedi un cuadro de mi mascota y quedo hermoso. Muy buena calidad y entrega puntual. 100% recomendado.',
    TRUE
FROM cuceimart.clientes c, cuceimart.emprendedores e
WHERE c.nombre_usuario = 'ana_cucei'
  AND e.slug_negocio = 'sanza-art';

-- =============================================================================
-- SECCIÓN 20: LIMPIEZA DE DATOS DE EJEMPLO (ejecutar antes del lanzamiento)
-- =============================================================================
-- IMPORTANTE: Ejecuta en este orden para respetar las llaves foraneas.
-- Descomenta y ejecuta bloque por bloque.
--
-- DELETE FROM estadisticas.clics_contacto;
-- DELETE FROM estadisticas.visitas_perfil;
-- DELETE FROM estadisticas.resumen_diario;
-- DELETE FROM cuceimart.respuestas_resenas;
-- DELETE FROM cuceimart.resenas;
-- DELETE FROM cuceimart.notificaciones;
-- DELETE FROM cuceimart.reportes;
-- DELETE FROM media.archivos;
-- DELETE FROM cuceimart.productos;
-- DELETE FROM cuceimart.emprendedores_destacados;
-- DELETE FROM cuceimart.sesiones;
-- DELETE FROM cuceimart.emprendedores;
-- DELETE FROM cuceimart.clientes;
-- SELECT setval('cuceimart.seq_verificacion', 1000, FALSE);

-- =============================================================================
-- VERIFICACION FINAL — Ejecuta esto para confirmar que todo se creo bien
-- =============================================================================
SELECT 'Roles'           AS tabla, COUNT(*) AS registros FROM cuceimart.roles
UNION ALL SELECT 'Emprendedores',  COUNT(*) FROM cuceimart.emprendedores
UNION ALL SELECT 'Clientes',       COUNT(*) FROM cuceimart.clientes
UNION ALL SELECT 'Productos',      COUNT(*) FROM cuceimart.productos
UNION ALL SELECT 'Resenas',        COUNT(*) FROM cuceimart.resenas
UNION ALL SELECT 'Destacados',     COUNT(*) FROM cuceimart.emprendedores_destacados
UNION ALL SELECT 'Media',          COUNT(*) FROM media.archivos
UNION ALL SELECT 'Estadisticas',   COUNT(*) FROM estadisticas.resumen_diario;

-- =============================================================================
-- FIN DEL DDL - CUCEI MART v2.0 | NEXCODE
-- =============================================================================
