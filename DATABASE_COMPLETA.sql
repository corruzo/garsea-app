-- ===========================================================================
-- GARSEA APP - BASE DE DATOS COMPLETA
-- Generado: 2026-02-20
-- Ejecutar en el SQL Editor de Supabase en el siguiente orden:
--   1. SECCIÓN 1: Eliminar todo lo existente
--   2. SECCIÓN 2: Crear tablas
--   3. SECCIÓN 3: Crear índices
--   4. SECCIÓN 4: Crear funciones y RPCs
--   5. SECCIÓN 5: Activar RLS y políticas de seguridad
-- ===========================================================================


-- ===========================================================================
-- SECCIÓN 1: ELIMINAR TODO LO EXISTENTE (LIMPIEZA TOTAL)
-- ===========================================================================

-- Eliminar políticas RLS primero (para no bloquear el DROP)
DROP POLICY IF EXISTS "Ver mi propia organización" ON organizaciones;
DROP POLICY IF EXISTS "Ver usuarios de mi organización" ON usuarios;
DROP POLICY IF EXISTS "Modificar mi propio usuario" ON usuarios;
DROP POLICY IF EXISTS "Gestión total de clientes por organización" ON clientes;
DROP POLICY IF EXISTS "Gestión total de préstamos por organización" ON prestamos;
DROP POLICY IF EXISTS "Gestión total de pagos por organización" ON pagos;
DROP POLICY IF EXISTS "Gestión total de documentos por organización" ON documentos;
DROP POLICY IF EXISTS "Gestión total de tasas por organización" ON tasas_cambio;
DROP POLICY IF EXISTS "Ver fechas de pago de mis préstamos" ON fechas_pago_personalizadas;

-- Eliminar funciones/RPCs
DROP FUNCTION IF EXISTS create_organization_with_admin(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS registrar_pago_prestamo(UUID, NUMERIC);
DROP FUNCTION IF EXISTS get_my_org_id();

-- Eliminar tablas (en orden de dependencias: hijos primero)
DROP TABLE IF EXISTS fechas_pago_personalizadas CASCADE;
DROP TABLE IF EXISTS documentos CASCADE;
DROP TABLE IF EXISTS pagos CASCADE;
DROP TABLE IF EXISTS prestamos CASCADE;
DROP TABLE IF EXISTS tasas_cambio CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS organizaciones CASCADE;


-- ===========================================================================
-- SECCIÓN 2: CREAR TABLAS
-- ===========================================================================

-- ─── Tabla: organizaciones ─────────────────────────────────────────────────
-- Entidad raíz. Cada organización es una empresa prestamista independiente.
CREATE TABLE organizaciones (
    id                   UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    nombre               TEXT NOT NULL,
    identificacion       TEXT,               -- RIF o cédula de la empresa
    email                TEXT,
    telefono             TEXT,
    tasa_referencia_pref VARCHAR(20) DEFAULT 'USD', -- 'USD', 'EUR' o 'PERSONALIZADA'
    settings             JSONB DEFAULT '{
        "prestamos": {
            "tasaInteresDefecto": "10",
            "tasaMoraDefecto": "5",
            "tiposPago": ["semanal", "quincenal", "mensual"],
            "requiereGarantia": false
        },
        "notificaciones": {
            "emailPagos": true,
            "recordatoriosPagos": true,
            "alertasVencidos": true,
            "reportesSemanales": false
        }
    }'::jsonb,
    fecha_creacion       TIMESTAMP DEFAULT now()
);

-- ─── Tabla: usuarios ──────────────────────────────────────────────────────
-- Usuarios del sistema. Vinculados a Supabase Auth y a una organización.
CREATE TABLE usuarios (
    id               SERIAL PRIMARY KEY,
    cedula           TEXT,
    organizacion_id  UUID REFERENCES organizaciones(id) ON DELETE SET NULL,
    nombre           TEXT,
    email            TEXT,
    telefono         TEXT,
    rol              TEXT DEFAULT 'admin',   -- 'admin', 'operador', etc.
    auth_id          UUID UNIQUE NOT NULL    -- ID de Supabase Auth
);

-- ─── Tabla: clientes ──────────────────────────────────────────────────────
-- Prestatarios. La cédula es PK ya que es el identificador natural único en Venezuela.
CREATE TABLE clientes (
    cedula              VARCHAR(20) PRIMARY KEY,
    organizacion_id     UUID NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    nombre              VARCHAR(255) NOT NULL,
    telefono            VARCHAR(20),
    direccion           TEXT,
    email               VARCHAR(255),
    fecha_nacimiento    DATE,
    notas               TEXT,
    foto_url            TEXT,               -- URL de foto de perfil (Supabase Storage)
    activo              BOOLEAN DEFAULT true,
    creado_por          VARCHAR(20),        -- Cédula del usuario que lo creó
    fecha_registro      TIMESTAMP DEFAULT now(),
    fecha_actualizacion TIMESTAMP DEFAULT now()
);

-- ─── Tabla: prestamos ─────────────────────────────────────────────────────
-- Contratos de préstamo. Núcleo del sistema.
CREATE TABLE prestamos (
    id                      UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organizacion_id         UUID NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    cliente_cedula          VARCHAR(20) NOT NULL REFERENCES clientes(cedula) ON DELETE RESTRICT,
    monto_capital           NUMERIC(12,2) NOT NULL,
    porcentaje_interes      NUMERIC(5,2) NOT NULL DEFAULT 10,
    tipo_pago               TEXT NOT NULL CHECK (tipo_pago IN ('semanal', 'quincenal', 'mensual')),
    fecha_inicio            DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin               DATE NOT NULL,
    duracion_semanas        INTEGER NOT NULL,
    total_a_pagar           NUMERIC(12,2) NOT NULL,  -- capital + interés total
    saldo_pendiente         NUMERIC(12,2) NOT NULL,  -- decrece con cada pago
    moneda                  TEXT NOT NULL DEFAULT 'USD' CHECK (moneda IN ('USD', 'VES')),
    estado                  TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'pagado', 'atrasado', 'en_mora')),
    -- Garantía
    tiene_garantia          BOOLEAN DEFAULT false,
    descripcion_garantia    TEXT,
    -- Mora
    intereses_moratorios    BOOLEAN DEFAULT false,
    porcentaje_mora         NUMERIC(5,2),
    fecha_mora              DATE,
    -- Auditoría
    creado_por              VARCHAR(20) NOT NULL,
    fecha_creacion          TIMESTAMP DEFAULT now(),
    fecha_actualizacion     TIMESTAMP DEFAULT now()
);

-- ─── Tabla: pagos ─────────────────────────────────────────────────────────
-- Registro de cada abono realizado a un préstamo.
CREATE TABLE pagos (
    id              UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organizacion_id UUID NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    prestamo_id     UUID NOT NULL REFERENCES prestamos(id) ON DELETE CASCADE,
    monto_abonado   NUMERIC(12,2) NOT NULL CHECK (monto_abonado > 0),
    moneda_pago     TEXT NOT NULL DEFAULT 'USD' CHECK (moneda_pago IN ('USD', 'VES')),
    tasa_cambio     NUMERIC(12,4) DEFAULT 1.0,  -- Tasa usada en el momento del pago (Bs por USD)
    metodo_pago     TEXT DEFAULT 'efectivo' CHECK (metodo_pago IN ('efectivo', 'transferencia', 'pago_movil', 'zelle', 'otro')),
    saldo_anterior  NUMERIC(12,2) NOT NULL,
    saldo_nuevo     NUMERIC(12,2) NOT NULL,
    notas           TEXT,
    registrado_por  VARCHAR(20) NOT NULL,
    tiene_comprobante BOOLEAN DEFAULT false,
    fecha_pago      TIMESTAMP DEFAULT now(),
    fecha_registro  TIMESTAMP DEFAULT now()
);

-- ─── Tabla: tasas_cambio ──────────────────────────────────────────────────
-- Historial de tasas BCV. Un registro por día por organización.
CREATE TABLE tasas_cambio (
    id                   UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organizacion_id      UUID NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    fecha                DATE NOT NULL DEFAULT CURRENT_DATE,
    tasa_dolar           NUMERIC(12,4) NOT NULL,
    tasa_euro            NUMERIC(12,4),
    tasa_personalizada   NUMERIC(12,4),  -- Tasa libre definida por el prestamista
    creado_por           VARCHAR(20),
    fecha_registro       TIMESTAMP DEFAULT now(),
    UNIQUE (organizacion_id, fecha)      -- Solo una tasa por día por org
);

-- ─── Tabla: documentos ────────────────────────────────────────────────────
-- Metadatos de archivos subidos a Supabase Storage.
-- Puede vincularse a un préstamo (garantía) o a un pago (comprobante).
CREATE TABLE documentos (
    id              UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organizacion_id UUID NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    tipo_entidad    TEXT NOT NULL CHECK (tipo_entidad IN ('prestamo', 'pago', 'cliente')),
    entidad_id      VARCHAR(100) NOT NULL,  -- UUID del préstamo, pago o cédula del cliente
    tipo_documento  TEXT NOT NULL CHECK (tipo_documento IN ('garantia', 'comprobante', 'identidad', 'otro')),
    nombre_archivo  VARCHAR(255) NOT NULL,
    url_archivo     TEXT NOT NULL,
    tamaño_bytes    BIGINT NOT NULL CHECK (tamaño_bytes > 0),
    mime_type       VARCHAR(100) NOT NULL,
    subido_por      VARCHAR(20) NOT NULL,
    notas           TEXT,
    activo          BOOLEAN DEFAULT true,
    fecha_subida    TIMESTAMP DEFAULT now()
);

-- ─── Tabla: fechas_pago_personalizadas ────────────────────────────────────
-- (Reservado para uso futuro: calendarios de pago custom por cuota)
CREATE TABLE fechas_pago_personalizadas (
    id                      UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    prestamo_id             UUID NOT NULL REFERENCES prestamos(id) ON DELETE CASCADE,
    fecha_pago_programada   DATE NOT NULL,
    monto_esperado          NUMERIC(12,2) NOT NULL CHECK (monto_esperado > 0),
    pagado                  BOOLEAN DEFAULT false,
    fecha_pago_real         TIMESTAMP,
    monto_pagado            NUMERIC(12,2) CHECK (monto_pagado >= 0),
    notas                   TEXT
);


-- ===========================================================================
-- SECCIÓN 3: ÍNDICES DE RENDIMIENTO
-- ===========================================================================

CREATE INDEX idx_usuarios_auth_id          ON usuarios(auth_id);
CREATE INDEX idx_usuarios_organizacion_id  ON usuarios(organizacion_id);
CREATE INDEX idx_clientes_organizacion     ON clientes(organizacion_id);
CREATE INDEX idx_clientes_activo           ON clientes(organizacion_id, activo);
CREATE INDEX idx_prestamos_organizacion    ON prestamos(organizacion_id);
CREATE INDEX idx_prestamos_cliente         ON prestamos(cliente_cedula);
CREATE INDEX idx_prestamos_estado          ON prestamos(organizacion_id, estado);
CREATE INDEX idx_pagos_organizacion        ON pagos(organizacion_id);
CREATE INDEX idx_pagos_prestamo            ON pagos(prestamo_id);
CREATE INDEX idx_pagos_fecha               ON pagos(fecha_pago DESC);
CREATE INDEX idx_tasas_organizacion_fecha  ON tasas_cambio(organizacion_id, fecha DESC);
CREATE INDEX idx_documentos_organizacion   ON documentos(organizacion_id);
CREATE INDEX idx_documentos_entidad        ON documentos(tipo_entidad, entidad_id);
CREATE INDEX idx_fechas_pago_prestamo      ON fechas_pago_personalizadas(prestamo_id);


-- ===========================================================================
-- SECCIÓN 4: FUNCIONES Y RPCs
-- ===========================================================================

-- ─── RPC: Registro atómico de organización + administrador ────────────────
-- Llamada desde authService.js en el registro inicial.
-- SECURITY DEFINER permite ignorar RLS durante la creación inicial.
CREATE OR REPLACE FUNCTION create_organization_with_admin(
    org_nombre        TEXT,
    org_identificacion TEXT,
    org_email         TEXT,
    org_telefono      TEXT,
    user_cedula       TEXT,
    user_nombre       TEXT,
    user_email        TEXT,
    user_telefono     TEXT,
    user_auth_id      UUID
) RETURNS JSONB AS $$
DECLARE
    new_org_id  UUID;
    new_user_id INTEGER;
BEGIN
    -- 1. Crear la organización
    INSERT INTO organizaciones (nombre, identificacion, email, telefono)
    VALUES (org_nombre, org_identificacion, org_email, org_telefono)
    RETURNING id INTO new_org_id;

    -- 2. Crear el usuario administrador vinculado a la org
    INSERT INTO usuarios (cedula, organizacion_id, nombre, email, telefono, rol, auth_id)
    VALUES (user_cedula, new_org_id, user_nombre, user_email, user_telefono, 'admin', user_auth_id)
    RETURNING id INTO new_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'organizacion_id', new_org_id,
        'usuario_id', new_user_id
    );

EXCEPTION
    WHEN unique_violation THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'La cédula o identificación ya existe en el sistema.',
            'detail', SQLSTATE
        );
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'detail', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── RPC: Registrar pago y actualizar saldo del préstamo (transacción) ────
-- Llamada desde paymentService.js al registrar un pago.
-- Garantiza consistencia: el saldo del préstamo siempre coincide con los pagos.
CREATE OR REPLACE FUNCTION registrar_pago_prestamo(
    p_prestamo_id UUID,
    p_monto       NUMERIC
) RETURNS JSONB AS $$
DECLARE
    v_saldo_actual  NUMERIC;
    v_saldo_nuevo   NUMERIC;
    v_nuevo_estado  TEXT;
BEGIN
    -- Leer saldo actual (bloqueo para concurrencia)
    SELECT saldo_pendiente INTO v_saldo_actual
    FROM prestamos
    WHERE id = p_prestamo_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Préstamo no encontrado');
    END IF;

    v_saldo_nuevo  := GREATEST(0, v_saldo_actual - p_monto);
    v_nuevo_estado := CASE WHEN v_saldo_nuevo <= 0 THEN 'pagado' ELSE 'activo' END;

    -- Actualizar préstamo
    UPDATE prestamos
    SET saldo_pendiente     = v_saldo_nuevo,
        estado              = v_nuevo_estado,
        fecha_actualizacion = now()
    WHERE id = p_prestamo_id;

    RETURN jsonb_build_object(
        'success',       true,
        'saldo_anterior', v_saldo_actual,
        'saldo_nuevo',    v_saldo_nuevo,
        'estado',         v_nuevo_estado
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── Función auxiliar para RLS ────────────────────────────────────────────
-- Devuelve el organizacion_id del usuario autenticado actualmente.
CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS UUID AS $$
    SELECT organizacion_id FROM usuarios WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ===========================================================================
-- SECCIÓN 5: ROW LEVEL SECURITY (RLS) — BLINDAJE MULTI-TENANT
-- Cada organización SOLO puede ver y manipular sus propios datos.
-- ===========================================================================

ALTER TABLE organizaciones             ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestamos                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasas_cambio               ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE fechas_pago_personalizadas ENABLE ROW LEVEL SECURITY;

-- Organizaciones: sólo ver la propia
CREATE POLICY "Ver mi propia organización" ON organizaciones
    FOR ALL USING (id = get_my_org_id());

-- Usuarios: ver compañeros de la misma org; solo el propio puede modificarse
CREATE POLICY "Ver usuarios de mi organización" ON usuarios
    FOR SELECT USING (organizacion_id = get_my_org_id());

CREATE POLICY "Modificar mi propio usuario" ON usuarios
    FOR UPDATE USING (auth_id = auth.uid());

-- Clientes
CREATE POLICY "Gestión total de clientes por organización" ON clientes
    FOR ALL USING (organizacion_id = get_my_org_id());

-- Préstamos
CREATE POLICY "Gestión total de préstamos por organización" ON prestamos
    FOR ALL USING (organizacion_id = get_my_org_id());

-- Pagos
CREATE POLICY "Gestión total de pagos por organización" ON pagos
    FOR ALL USING (organizacion_id = get_my_org_id());

-- Tasas de cambio
CREATE POLICY "Gestión total de tasas por organización" ON tasas_cambio
    FOR ALL USING (organizacion_id = get_my_org_id());

-- Documentos
CREATE POLICY "Gestión total de documentos por organización" ON documentos
    FOR ALL USING (organizacion_id = get_my_org_id());

-- Fechas de pago personalizadas (filtradas por préstamo que pertenece a la org)
CREATE POLICY "Ver fechas de pago de mis préstamos" ON fechas_pago_personalizadas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM prestamos
            WHERE prestamos.id = fechas_pago_personalizadas.prestamo_id
              AND prestamos.organizacion_id = get_my_org_id()
        )
    );


-- ===========================================================================
-- NOTAS IMPORTANTES PARA SUPABASE
-- ===========================================================================
-- 1. STORAGE: Crear un bucket llamado "guarantees" (público o privado según prefieras).
--    - Se usa para fotos de garantías de préstamos (carpeta /garantias/)
--    - Se usa para comprobantes de pago (carpeta /comprobantes/)
--
-- 2. AUTH: Asegúrate de que el email confirmation esté configurado según necesites.
--    El sistema maneja el mensaje 'Email not confirmed' en el login.
--
-- 3. FUNCIONES: Las RPCs 'create_organization_with_admin' y 'registrar_pago_prestamo'
--    son SECURITY DEFINER, lo que les permite operar fuera de RLS cuando es necesario.
--    Esto es intencional y seguro porque ambas funciones validan sus propias condiciones.
-- ===========================================================================
