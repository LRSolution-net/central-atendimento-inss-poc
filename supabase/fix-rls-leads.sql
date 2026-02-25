-- ============================================================
-- FIX RLS para tabela leads - permitir INSERT anônimo
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- 1. Verificar políticas existentes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'leads';

-- 2. Remover todas as políticas antigas
DROP POLICY IF EXISTS leads_insert_anon ON public.leads;
DROP POLICY IF EXISTS leads_select_anon ON public.leads;
DROP POLICY IF EXISTS "Enable insert for anon users" ON public.leads;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.leads;

-- 3. Criar políticas corretas

-- Permite INSERT para usuários anônimos com consentimento
CREATE POLICY "leads_insert_anon"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (consentimento = true);

-- Permite SELECT para usuários anônimos (para ler após inserir)
CREATE POLICY "leads_select_anon"
ON public.leads
FOR SELECT
TO anon
USING (true);

-- Permite INSERT para usuários autenticados
CREATE POLICY "leads_insert_authenticated"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permite SELECT para usuários autenticados
CREATE POLICY "leads_select_authenticated"
ON public.leads
FOR SELECT
TO authenticated
USING (true);

-- Permite UPDATE para usuários autenticados
CREATE POLICY "leads_update_authenticated"
ON public.leads
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Permite DELETE para usuários autenticados
CREATE POLICY "leads_delete_authenticated"
ON public.leads
FOR DELETE
TO authenticated
USING (true);

-- 4. Garantir que RLS está habilitado
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 5. Garantir permissões para o role anon
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON public.leads TO anon;
GRANT ALL ON public.leads TO authenticated;

-- 6. Verificar políticas criadas
SELECT 
    policyname,
    cmd as operacao,
    roles,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check::text
        WHEN qual IS NOT NULL THEN 'USING: ' || qual::text
        ELSE 'SEM CONDIÇÃO'
    END as condicao
FROM pg_policies 
WHERE tablename = 'leads'
ORDER BY policyname;
