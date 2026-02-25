-- ================================================================
-- CRIAR USUÁRIO - SCRIPT SIMPLES
-- Cole no SQL Editor do Supabase e execute
-- ================================================================

-- ✏️ EDITE APENAS ESTAS 4 LINHAS:
DO $$
DECLARE
    v_email TEXT := 'seu.email@exemplo.com';
    v_nome TEXT := 'Seu Nome Completo';
    v_senha TEXT := 'senha123';
    v_role TEXT := 'comum';  -- 'comum' ou 'admin'
    
    -- NÃO EDITE DAQUI PRA BAIXO
    v_id UUID;
    existe UUID;
BEGIN
    -- Verifica se já existe
    SELECT id INTO existe FROM auth.users WHERE email = v_email;
    IF existe IS NOT NULL THEN
        RAISE EXCEPTION '❌ Email % já cadastrado!', v_email;
    END IF;
    
    v_id := gen_random_uuid();
    
    -- Cria no auth
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data, 
        confirmation_token, is_super_admin
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_id, 'authenticated', 'authenticated',
        v_email, crypt(v_senha, gen_salt('bf')),
        NOW(), NOW(), NOW(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('nome', v_nome, 'role', v_role),
        '', false
    );
    
    -- Cria perfil
    INSERT INTO public.profiles (id, email, nome, role, ativo)
    VALUES (v_id, v_email, v_nome, v_role, true);
    
    RAISE NOTICE '✅ Usuário % criado com sucesso!', v_email;
END $$;
