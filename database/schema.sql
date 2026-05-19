-- SCRIPT DE BANCO DE DADOS: Plataforma de Automação de Documentos
-- Recomendado para rodar no Editor SQL do Supabase.

-- Habilitar a extensão para geração de UUID se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABELAS PRINCIPAIS
-- ==========================================

-- Tabela de Templates (Modelos de Documentos)
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL, -- Conteúdo bruto com placeholders {chave}
    visual_identity JSONB NOT NULL DEFAULT '{"theme": "classic", "margins": {"top": "2.5cm", "bottom": "2.5cm", "left": "3.0cm", "right": "2.0cm"}, "header": "", "footer": "", "primary_color": "#1e293b"}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Campos Dinâmicos (Variáveis do Formulário)
CREATE TABLE IF NOT EXISTS public.template_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
    label TEXT NOT NULL, -- Ex: "Nome do Cliente"
    key TEXT NOT NULL, -- Ex: "nome_cliente" (gerado limpo de forma automatizada)
    type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'number', 'date', 'textarea', 'select')),
    required BOOLEAN NOT NULL DEFAULT false,
    placeholder TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Documentos Gerados
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL, -- Ex: "Contrato - João Silva"
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Valores preenchidos pelo usuário
    rendered_content TEXT NOT NULL, -- HTML final gerado com a casca do papel timbrado aplicada
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 2. TRIGGERS DE ATUALIZAÇÃO AUTOMÁTICA (UPDATED_AT)
-- ==========================================

-- Função auxiliar para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para Templates
CREATE TRIGGER trigger_update_templates_timestamp
    BEFORE UPDATE ON public.templates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para Documentos
CREATE TRIGGER trigger_update_documents_timestamp
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================
-- 3. POLÍTICAS DE SEGURANÇA (RLS - Row Level Security)
-- ==========================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PARA: public.templates
CREATE POLICY "Usuários podem gerenciar seus próprios templates" 
    ON public.templates
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- POLÍTICAS PARA: public.template_fields
-- Permite leitura e escrita apenas se o usuário for o dono do template correspondente
CREATE POLICY "Usuários podem gerenciar campos dos seus templates"
    ON public.template_fields
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.templates 
            WHERE templates.id = template_fields.template_id 
            AND templates.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.templates 
            WHERE templates.id = template_fields.template_id 
            AND templates.user_id = auth.uid()
        )
    );

-- POLÍTICAS PARA: public.documents
CREATE POLICY "Usuários podem gerenciar seus próprios documentos"
    ON public.documents
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- 4. ÍNDICES DE PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates(user_id);
CREATE INDEX IF NOT EXISTS idx_template_fields_template_id ON public.template_fields(template_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_template_id ON public.documents(template_id);
