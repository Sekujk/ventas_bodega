-- Row Level Security (RLS) Policies para Ventas Bodega
-- Ejecutar en Supabase SQL Editor

-- TABLA: clientes
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own clients"
  ON clientes FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own clients"
  ON clientes FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own clients"
  ON clientes FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own clients"
  ON clientes FOR DELETE
  USING (auth.uid()::text = user_id);

-- TABLA: ventas
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sales"
  ON ventas FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own sales"
  ON ventas FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own sales"
  ON ventas FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own sales"
  ON ventas FOR DELETE
  USING (auth.uid()::text = user_id);

-- TABLA: pagos
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
  ON pagos FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own payments"
  ON pagos FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own payments"
  ON pagos FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own payments"
  ON pagos FOR DELETE
  USING (auth.uid()::text = user_id);
