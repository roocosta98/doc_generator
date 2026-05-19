-- SCRIPT DE MIGRAÇÃO: Painel de Usuários (Admin) e Sincronização de Perfis
-- Recomendado para rodar no Editor SQL do Supabase.

-- ==========================================
-- 1. CRIAÇÃO DA TABELA DE PERFIS PUBLICOS
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 2. FUNÇÃO E TRIGGER DE SINCRONIZAÇÃO AUTOMÁTICA
-- ==========================================

-- Função que espelha o usuário recém-criado em auth.users para public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role TEXT := 'client';
BEGIN
    -- 1. Se houver metadados com role especificada pelo admin, usa ela
    IF NEW.raw_user_meta_data ? 'role' THEN
        default_role := NEW.raw_user_meta_data->>'role';
    -- 2. Fallback de segurança para facilitar testes do admin
    ELSIF NEW.email = 'admin@admin.com' OR NEW.email LIKE 'admin%' THEN
        default_role := 'admin';
    END IF;

    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, default_role)
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger executado APÓS um novo insert em auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 3. FUNÇÃO AUXILIAR DE SEGURANÇA (Evita recursão infinita na RLS)
-- ==========================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 4. POLÍTICAS DE SEGURANÇA (RLS)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove políticas anteriores para evitar erro de duplicidade se reexecutado
DROP POLICY IF EXISTS "Qualquer usuário pode ver seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Admins podem visualizar todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON public.profiles;

-- Permite que qualquer usuário autenticado leia seu próprio perfil
CREATE POLICY "Qualquer usuário pode ver seu próprio perfil"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Permite que Administradores leiam todos os perfis cadastrados
CREATE POLICY "Admins podem visualizar todos os perfis"
    ON public.profiles
    FOR SELECT
    USING (
        public.is_admin()
    );

-- Permite que o próprio usuário edite seus dados (exceto trocar a role)
CREATE POLICY "Usuários podem atualizar seus próprios perfis"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ==========================================
-- 4. MIGRAÇÃO DE USUÁRIOS JÁ EXISTENTES
-- ==========================================
-- Caso você já tenha usuários cadastrados na tabela auth.users,
-- esta instrução popula a tabela de perfis de forma retroativa.
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 
    CASE WHEN email = 'admin@admin.com' OR email LIKE 'admin%' THEN 'admin'::text ELSE 'client'::text END
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 5. FUNÇÕES DE GERENCIAMENTO DE USUÁRIOS (ADMIN ONLY)
-- ==========================================

-- Função segura para criar usuários direto do frontend (Admin Only)
CREATE OR REPLACE FUNCTION public.create_user(
    user_email TEXT,
    user_password TEXT,
    user_role TEXT
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID := gen_random_uuid();
BEGIN
    -- Validação: Apenas administradores ativos podem invocar
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Apenas administradores possuem acesso a este recurso.';
    END IF;

    -- Validação da Role
    IF user_role NOT IN ('client', 'admin') THEN
        RAISE EXCEPTION 'Nível de acesso inválido. Escolha "client" ou "admin".';
    END IF;

    -- 1. Inserir na tabela de autenticação (auth.users)
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        user_email,
        crypt(user_password, gen_salt('bf')),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('role', user_role),
        now(),
        now(),
        '',
        '',
        '',
        ''
    );

    -- 2. Inserir na tabela de identidades (auth.identities) para viabilizar login via GoTrue
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        new_user_id::text,
        new_user_id,
        jsonb_build_object('sub', new_user_id::text, 'email', user_email, 'email_verified', true, 'phone_verified', false),
        'email',
        user_email,
        now(),
        now(),
        now()
    );

    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função segura para exclusão de usuários (Admin Only)
CREATE OR REPLACE FUNCTION public.delete_user(user_id UUID)
RETURNS void AS $$
BEGIN
    -- Validação: Apenas administradores ativos podem invocar
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Apenas administradores possuem acesso a este recurso.';
    END IF;

    -- Impedir exclusão de si mesmo
    IF user_id = auth.uid() THEN
        RAISE EXCEPTION 'Você não pode excluir o seu próprio perfil de administrador ativo.';
    END IF;

    -- Executa a exclusão de auth.users (cascateará para profiles, templates, etc)
    DELETE FROM auth.users WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 6. ADICIONAR COLUNA DE CATEGORIA NOS TEMPLATES
-- ==========================================
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Geral';

-- ==========================================
-- 7. REPARO DE USUÁRIOS SEM IDENTIDADE (CORREÇÃO DE ERRO 500 NA AUTENTICAÇÃO)
-- ==========================================
-- Vincula identidades para usuários existentes criados diretamente via SQL antigo
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
)
SELECT 
    u.id::text,
    u.id,
    jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
    'email',
    u.email,
    now(),
    now(),
    now()
FROM auth.users u
LEFT JOIN auth.identities i ON u.id = i.user_id
WHERE i.user_id IS NULL;

-- Corrige a confirmação de contas legadas se necessário
UPDATE auth.users
SET confirmed_at = COALESCE(confirmed_at, email_confirmed_at, created_at)
WHERE confirmed_at IS NULL;

-- Corrige as colunas de texto que não podem ser NULL para evitar erro 500 de Scan do GoTrue
UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, '')
WHERE confirmation_token IS NULL 
   OR email_change IS NULL 
   OR email_change_token_new IS NULL 
   OR recovery_token IS NULL;
