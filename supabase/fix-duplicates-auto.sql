-- ============================================================
-- EXECUÇÃO RÁPIDA: Remove duplicados e cria índice
-- ⚠️ Leia antes de executar!
-- ============================================================

-- Este script:
-- 1. Remove registros duplicados (mantém o mais recente)
-- 2. Cria índice único no campo whatsapp
-- 3. Adiciona campo sexo

-- ⚠️ IMPORTANTE: Faça backup antes de executar!

DO $$
DECLARE
    v_duplicados INT;
    v_deletados INT;
BEGIN
    -- Contar duplicados
    SELECT COUNT(*) INTO v_duplicados
    FROM (
        SELECT whatsapp
        FROM public.leads
        GROUP BY whatsapp
        HAVING COUNT(*) > 1
    ) t;
    
    RAISE NOTICE '📊 Encontrados % WhatsApps duplicados', v_duplicados;
    
    -- Deletar duplicados (mantém mais recente)
    WITH duplicados AS (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY whatsapp ORDER BY created_at DESC) as rn
        FROM public.leads
    )
    DELETE FROM public.leads
    WHERE id IN (SELECT id FROM duplicados WHERE rn > 1);
    
    GET DIAGNOSTICS v_deletados = ROW_COUNT;
    RAISE NOTICE '🗑️  Deletados % registros duplicados antigos', v_deletados;
    
    -- Adicionar campo sexo
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS sexo text;
    RAISE NOTICE '✅ Coluna sexo adicionada';
    
    -- Atualizar registros sem sexo
    UPDATE public.leads SET sexo = 'nao-informado' WHERE sexo IS NULL;
    RAISE NOTICE '✅ Registros antigos atualizados com sexo padrão';
    
    -- Criar índice único
    CREATE UNIQUE INDEX IF NOT EXISTS leads_whatsapp_unique_idx ON public.leads(whatsapp);
    RAISE NOTICE '✅ Índice único criado em whatsapp';
    
    RAISE NOTICE '🎉 Migração concluída com sucesso!';
END $$;

-- Verificação final
SELECT 
    '✅ Total de leads: ' || COUNT(*) as resultado
FROM public.leads
UNION ALL
SELECT 
    '✅ WhatsApps únicos: ' || COUNT(DISTINCT whatsapp)
FROM public.leads
UNION ALL
SELECT 
    '⚠️  Duplicados restantes: ' || COUNT(*)
FROM (
    SELECT whatsapp
    FROM public.leads
    GROUP BY whatsapp
    HAVING COUNT(*) > 1
) t;
