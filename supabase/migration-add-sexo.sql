-- ================================================================
-- Migration: Adicionar campo sexo na tabela leads
-- ================================================================

-- Adicionar campo sexo (se não existir)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS sexo text;

-- Atualizar registros existentes sem sexo
UPDATE public.leads 
SET sexo = 'nao-informado' 
WHERE sexo IS NULL;

-- ================================================================
-- Verificar estrutura da tabela leads
-- ================================================================
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'leads' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ================================================================
-- Ver constraints e índices
-- ================================================================
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.leads'::regclass
ORDER BY conname;

-- Ver índices
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'leads'
  AND schemaname = 'public';
