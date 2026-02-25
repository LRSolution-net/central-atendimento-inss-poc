-- ============================================================
-- GUIA PASSO A PASSO: Corrigir duplicados e criar índice único
-- Execute linha por linha no SQL Editor do Supabase
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- PASSO 1: VERIFICAR DUPLICADOS (apenas visualizar)
-- ═══════════════════════════════════════════════════════════
-- Esta query mostra quantos WhatsApps duplicados existem
SELECT 
    whatsapp, 
    COUNT(*) as total_duplicados,
    STRING_AGG(nome || ' (ID: ' || id::text || ', Criado: ' || created_at::date::text || ')', '; ') as detalhes
FROM public.leads
GROUP BY whatsapp
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- ═══════════════════════════════════════════════════════════
-- PASSO 2: VER QUANTOS REGISTROS SERÃO AFETADOS
-- ═══════════════════════════════════════════════════════════
-- Esta query conta quantos registros serão deletados
-- (mantém apenas o mais recente de cada WhatsApp)
SELECT COUNT(*) as total_que_sera_deletado
FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY whatsapp ORDER BY created_at DESC) as posicao
    FROM public.leads
) t
WHERE posicao > 1;

-- ═══════════════════════════════════════════════════════════
-- PASSO 3: VER EXATAMENTE QUAIS REGISTROS SERÃO DELETADOS
-- ═══════════════════════════════════════════════════════════
-- Confira antes de deletar! Estes são os registros ANTIGOS que serão removidos
SELECT 
    id,
    nome,
    whatsapp,
    created_at,
    'SERÁ DELETADO (é duplicado, existe um mais recente)' as status
FROM (
    SELECT 
        id,
        nome,
        whatsapp,
        created_at,
        ROW_NUMBER() OVER (PARTITION BY whatsapp ORDER BY created_at DESC) as posicao
    FROM public.leads
) t
WHERE posicao > 1
ORDER BY whatsapp, created_at DESC;

-- ═══════════════════════════════════════════════════════════
-- PASSO 4: DELETAR DUPLICADOS (⚠️ CUIDADO!)
-- ═══════════════════════════════════════════════════════════
-- ⚠️ ATENÇÃO: Esta operação é IRREVERSÍVEL!
-- Só execute depois de verificar os passos anteriores
-- 
-- Esta query mantém apenas o registro MAIS RECENTE de cada WhatsApp
-- e deleta todos os outros duplicados
DELETE FROM public.leads
WHERE id IN (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (PARTITION BY whatsapp ORDER BY created_at DESC) as posicao
        FROM public.leads
    ) t
    WHERE posicao > 1
);
-- Resultado esperado: "DELETE X" (onde X é o número de duplicados removidos)

-- ═══════════════════════════════════════════════════════════
-- PASSO 5: CONFIRMAR QUE NÃO HÁ MAIS DUPLICADOS
-- ═══════════════════════════════════════════════════════════
-- Esta query deve retornar 0 linhas (nenhum duplicado)
SELECT whatsapp, COUNT(*) as total
FROM public.leads
GROUP BY whatsapp
HAVING COUNT(*) > 1;
-- Resultado esperado: (nenhuma linha)

-- ═══════════════════════════════════════════════════════════
-- PASSO 6: CRIAR ÍNDICE ÚNICO
-- ═══════════════════════════════════════════════════════════
-- Agora que não há duplicados, podemos criar o índice único
CREATE UNIQUE INDEX IF NOT EXISTS leads_whatsapp_unique_idx 
ON public.leads(whatsapp);
-- Resultado esperado: "CREATE INDEX"

-- ═══════════════════════════════════════════════════════════
-- PASSO 7: ADICIONAR CAMPO SEXO
-- ═══════════════════════════════════════════════════════════
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS sexo text;

UPDATE public.leads 
SET sexo = 'nao-informado' 
WHERE sexo IS NULL;
-- Resultado esperado: "ALTER TABLE" e "UPDATE X"

-- ═══════════════════════════════════════════════════════════
-- PASSO 8: VERIFICAR TUDO
-- ═══════════════════════════════════════════════════════════
-- Ver estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leads' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ver índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'leads' AND schemaname = 'public';

-- ═══════════════════════════════════════════════════════════
-- ✅ PRONTO!
-- ═══════════════════════════════════════════════════════════
-- Agora:
-- 1. O índice único está criado (previne duplicados futuros)
-- 2. Campo 'sexo' foi adicionado
-- 3. Registros duplicados antigos foram removidos
-- 4. O formulário já valida WhatsApp antes de inserir
