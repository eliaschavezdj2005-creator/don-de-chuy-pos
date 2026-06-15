-- Habilitar Realtime para las tablas
-- IMPORTANTE: Ejecuta esto DESPUÉS del SQL anterior

-- Primero verifica que la publicación existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Agregar las tablas a la publicación
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;

-- Opcional: Ver las tablas en la publicación
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
