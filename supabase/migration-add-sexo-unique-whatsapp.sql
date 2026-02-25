-- ============================================================
-- Atualização: Adiciona campo sexo e índice único em whatsapp
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Adicionar coluna sexo
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS sexo text;

-- 2. Atualizar leads existentes sem sexo (opcional)
UPDATE public.leads 
SET sexo = 'nao-informado' 
WHERE sexo IS NULL;

-- 3. LIMPAR DUPLICADOS ANTES DE CRIAR ÍNDICE ÚNICO
-- Primeiro, veja quais WhatsApps estão duplicados:
SELECT whatsapp, COUNT(*) as total, STRING_AGG(nome, ', ') as nomes
FROM public.leads
GROUP BY whatsapp
HAVING COUNT(*) > 1
ORDER BY total DESC;

-- 4. OPÇÃO A: Deletar duplicados (mantém apenas o mais recente por WhatsApp)
-- ⚠️ CUIDADO: Isso vai apagar registros! Faça backup antes!
DELETE FROM public.leads
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY whatsapp ORDER BY created_at DESC) as rn
        FROM public.leads
    ) t
    WHERE rn > 1
);

-- 5. OPÇÃO B: Verificar quantos serão deletados SEM executar
-- (Execute apenas esta query para ver o impacto)
SELECT COUNT(*) as registros_que_serao_deletados
FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY whatsapp ORDER BY created_at DESC) as rn
    FROM public.leads
) t
WHERE rn > 1;

-- 6. Criar índice único para whatsapp (evita duplicatas futuras)
CREATE UNIQUE INDEX IF NOT EXISTS leads_whatsapp_unique_idx 
ON public.leads(whatsapp);

-- 7. Verificar estrutura atualizada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leads' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. Verificar se ainda há duplicados (deve retornar 0 linhas)
SELECT whatsapp, COUNT(*) as total
FROM public.leads
GROUP BY whatsapp
HAVING COUNT(*) > 1;
