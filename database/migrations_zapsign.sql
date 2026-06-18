-- SCRIPT DE MIGRAÇÃO: Adiciona coluna para metadados de assinatura do ZapSign
-- Execute este script no SQL Editor do seu projeto Supabase.

-- Adiciona a coluna zapsign_metadata na tabela public.documents
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS zapsign_metadata JSONB DEFAULT NULL;

-- Comentário para documentar a coluna
COMMENT ON COLUMN public.documents.zapsign_metadata IS 'Metadados da integração com o ZapSign (doc_token, status, sign_url, signers, etc)';

-- Adiciona colunas para chaves individuais do ZapSign por usuário
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS zapsign_api_token TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS zapsign_env TEXT DEFAULT 'sandbox';

COMMENT ON COLUMN public.profiles.zapsign_api_token IS 'Chave de API individual do ZapSign do usuário';
COMMENT ON COLUMN public.profiles.zapsign_env IS 'Ambiente de execução da API do ZapSign (sandbox ou production)';

-- Adiciona coluna blocks na tabela templates para salvar estrutura do editor de blocos
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS blocks JSONB DEFAULT NULL;

-- Tabela de Cláusulas (Biblioteca de Cláusulas Reutilizáveis)
CREATE TABLE IF NOT EXISTS public.clauses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS nas cláusulas
ALTER TABLE public.clauses ENABLE ROW LEVEL SECURITY;

-- Evita erro de duplicidade de políticas se reexecutado
DROP POLICY IF EXISTS "Usuários podem gerenciar suas próprias cláusulas" ON public.clauses;

CREATE POLICY "Usuários podem gerenciar suas próprias cláusulas"
    ON public.clauses
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
