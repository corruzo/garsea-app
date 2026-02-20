-- ===========================================================================
-- GARSEA APP - ACTUALIZACIÓN GESTIÓN DE CAPITAL
-- Ejecutar en el SQL Editor de Supabase
-- ===========================================================================

-- 1. Crear tabla de movimientos de capital (Caja Chica / Liquidez)
CREATE TABLE IF NOT EXISTS capital_movimientos (
    id              UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    organizacion_id UUID NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    monto           NUMERIC(12,2) NOT NULL,
    moneda          TEXT NOT NULL DEFAULT 'USD' CHECK (moneda IN ('USD', 'VES')),
    tipo            TEXT NOT NULL CHECK (tipo IN ('inicio', 'aporte', 'retiro', 'prestamo', 'pago')),
    referencia_id   UUID, -- ID del préstamo o pago relacionado
    notas           TEXT,
    fecha_registro  TIMESTAMP DEFAULT now()
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_capital_org ON capital_movimientos(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_capital_fecha ON capital_movimientos(fecha_registro DESC);

-- 3. Habilitar RLS
ALTER TABLE capital_movimientos ENABLE ROW LEVEL SECURITY;

-- 4. Política de seguridad
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'capital_movimientos' AND policyname = 'Gestión de capital por organización'
    ) THEN
        CREATE POLICY "Gestión de capital por organización" ON capital_movimientos
        FOR ALL USING (organizacion_id = (SELECT organizacion_id FROM usuarios WHERE auth_id = auth.uid() LIMIT 1));
    END IF;
END $$;

-- 5. Trigger para registrar movimiento automáticamente al crear un préstamo
CREATE OR REPLACE FUNCTION trigger_registrar_salida_capital()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO capital_movimientos (organizacion_id, monto, moneda, tipo, referencia_id, notas)
    VALUES (NEW.organizacion_id, -NEW.monto_capital, NEW.moneda, 'prestamo', NEW.id, 'Préstamo otorgado');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prestamo_salida_capital ON prestamos;
CREATE TRIGGER trg_prestamo_salida_capital
AFTER INSERT ON prestamos
FOR EACH ROW EXECUTE FUNCTION trigger_registrar_salida_capital();

-- 6. Trigger para registrar movimiento automáticamente al recibir un pago
CREATE OR REPLACE FUNCTION trigger_registrar_entrada_capital()
RETURNS TRIGGER AS $$
DECLARE
    v_moneda_prestamo TEXT;
BEGIN
    -- Obtenemos la moneda del préstamo para asegurar consistencia
    SELECT moneda INTO v_moneda_prestamo FROM prestamos WHERE id = NEW.prestamo_id;
    
    INSERT INTO capital_movimientos (organizacion_id, monto, moneda, tipo, referencia_id, notas)
    VALUES (NEW.organizacion_id, NEW.monto_abonado, v_moneda_prestamo, 'pago', NEW.id, 'Pago de cuota recibido');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_pago_entrada_capital ON pagos;
CREATE TRIGGER trg_pago_entrada_capital
AFTER INSERT ON pagos
FOR EACH ROW EXECUTE FUNCTION trigger_registrar_entrada_capital();
