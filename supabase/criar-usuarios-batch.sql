-- ================================================================
-- Script para criar usuários em lote (sem rate limit)
-- Execute no SQL Editor do Supabase Dashboard
-- ================================================================

-- ================================================================
-- 🔍 ANTES DE CRIAR: Verificar se email já existe
-- ================================================================
SELECT 
    u.email,
    u.created_at,
    p.nome,
    p.role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'atendente@exemplo.com';  -- ✏️ TROQUE PELO EMAIL QUE QUER VERIFICAR

-- Se retornar resultado = Email já existe! Use outro email ou delete o usuário abaixo


-- ================================================================
-- 🗑️ DELETAR usuário existente (se necessário)
-- ================================================================
-- USE COM CUIDADO! Isso deleta permanentemente o usuário

DO $$
DECLARE
    user_id_to_delete UUID;
BEGIN
    SELECT id INTO user_id_to_delete 
    FROM auth.users 
    WHERE email = 'atendente@exemplo.com';  -- ✏️ EMAIL A DELETAR
    
    IF user_id_to_delete IS NOT NULL THEN
        DELETE FROM public.profiles WHERE id = user_id_to_delete;
        DELETE FROM auth.users WHERE id = user_id_to_delete;
        RAISE NOTICE 'Usuário deletado: %', user_id_to_delete;
    ELSE
        RAISE NOTICE 'Usuário não encontrado';
    END IF;
END $$;


-- ================================================================
-- 1️⃣ Criar UM usuário (COM VERIFICAÇÃO DE DUPLICAÇÃO)
-- ================================================================
DO $$
DECLARE
    novo_user_id UUID;
    email_usuario TEXT := 'atendente1@exemplo.com';  -- ✏️ TROQUE AQUI
    nome_usuario TEXT := 'Nome do Atendente';        -- ✏️ TROQUE AQUI
    senha_usuario TEXT := 'senha123';                -- ✏️ TROQUE AQUI
    role_usuario TEXT := 'comum';                    -- comum ou admin
    user_exists UUID;
BEGIN
    -- Verifica se já existe
    SELECT id INTO user_exists FROM auth.users WHERE email = email_usuario;
    
    IF user_exists IS NOT NULL THEN
        RAISE EXCEPTION 'Email % já existe! Use outro email ou delete o usuário primeiro.', email_usuario;
    END IF;
    
    -- Gera ID único
    novo_user_id := gen_random_uuid();
    
    -- Insere usuário no auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        confirmation_token,
        is_super_admin
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        novo_user_id,
        'authenticated',
        'authenticated',
        email_usuario,
        crypt(senha_usuario, gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('nome', nome_usuario, 'role', role_usuario),
        '',
        false
    );
    
    -- Cria perfil automaticamente
    INSERT INTO public.profiles (id, email, nome, role, ativo)
    VALUES (
        novo_user_id,
        email_usuario,
        nome_usuario,
        role_usuario,
        true
    );
    
    RAISE NOTICE '✅ Usuário criado com sucesso! ID: % | Email: %', novo_user_id, email_usuario;
END $$;

-- ================================================================
-- 2️⃣ Criar MÚLTIPLOS usuários de uma vez (COM VERIFICAÇÃO)
-- ================================================================
DO $$
DECLARE
    usuarios JSON[] := ARRAY[
        '{"email":"atendente2@exemplo.com","nome":"João Silva","senha":"senha123","role":"comum"}',
        '{"email":"atendente3@exemplo.com","nome":"Maria Santos","senha":"senha456","role":"comum"}',
        '{"email":"admin2@exemplo.com","nome":"Admin Sistema","senha":"admin789","role":"admin"}'
    ]::JSON[];  -- ✏️ TROQUE OS DADOS AQUI
    usuario JSON;
    novo_id UUID;
    user_exists UUID;
BEGIN
    FOREACH usuario IN ARRAY usuarios
    LOOP
        -- Verifica se email já existe
        SELECT id INTO user_exists FROM auth.users WHERE email = usuario->>'email';
        
        IF user_exists IS NOT NULL THEN
            RAISE NOTICE '⚠️  Pulado (já existe): %', usuario->>'email';
            CONTINUE;
        END IF;
        
        novo_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, created_at, updated_at,
            raw_app_meta_data, raw_user_meta_data, confirmation_token, is_super_admin
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            novo_id,
            'authenticated',
            'authenticated',
            usuario->>'email',
            crypt(usuario->>'senha', gen_salt('bf')),
            NOW(), NOW(), NOW(),
            '{"provider":"email","providers":["email"]}',
            jsonb_build_object('nome', usuario->>'nome', 'role', usuario->>'role'),
            '', false
        );
        
        INSERT INTO public.profiles (id, email, nome, role, ativo)
        VALUES (
            novo_id,
            usuario->>'email',
            usuario->>'nome',
            usuario->>'role',
            true
        );
        
        RAISE NOTICE '✅ Criado: % (%)', usuario->>'nome', usuario->>'email';
    END LOOP;
END $$;

-- ================================================================
-- Verificar usuários criados
-- ================================================================
SELECT 
    p.nome,
    p.email,
    p.role,
    p.ativo,
    p.created_at
FROM public.profiles p
ORDER BY p.created_at DESC
LIMIT 10;
