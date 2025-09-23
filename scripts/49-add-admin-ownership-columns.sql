-- Adicionar colunas admin_id às tabelas relevantes

-- Função para verificar se uma coluna existe
CREATE OR REPLACE FUNCTION column_exists(table_name text, column_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1 
        AND column_name = $2
    );
END;
$$ LANGUAGE plpgsql;

-- Adicionar admin_id à tabela app_config
DO $$
BEGIN
    IF NOT column_exists('app_config', 'admin_id') THEN
        ALTER TABLE public.app_config ADD COLUMN admin_id UUID REFERENCES public.profiles(id);
        -- Definir um admin padrão para registros existentes
        UPDATE public.app_config SET admin_id = (
            SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1
        ) WHERE admin_id IS NULL;
    END IF;
END $$;

-- Adicionar admin_id à tabela api_keys
DO $$
BEGIN
    IF NOT column_exists('api_keys', 'admin_id') THEN
        ALTER TABLE public.api_keys ADD COLUMN admin_id UUID REFERENCES public.profiles(id);
        -- Definir um admin padrão para registros existentes
        UPDATE public.api_keys SET admin_id = (
            SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1
        ) WHERE admin_id IS NULL;
    END IF;
END $$;

-- Adicionar admin_id à tabela documents
DO $$
BEGIN
    IF NOT column_exists('documents', 'admin_id') THEN
        ALTER TABLE public.documents ADD COLUMN admin_id UUID REFERENCES public.profiles(id);
        -- Definir um admin padrão para registros existentes
        UPDATE public.documents SET admin_id = (
            SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1
        ) WHERE admin_id IS NULL;
    END IF;
END $$;

-- Adicionar admin_id à tabela heresy_responses
DO $$
BEGIN
    IF NOT column_exists('heresy_responses', 'admin_id') THEN
        ALTER TABLE public.heresy_responses ADD COLUMN admin_id UUID REFERENCES public.profiles(id);
        -- Definir um admin padrão para registros existentes
        UPDATE public.heresy_responses SET admin_id = (
            SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1
        ) WHERE admin_id IS NULL;
    END IF;
END $$;

-- Criar políticas RLS para acesso administrativo
-- Política para app_config
DROP POLICY IF EXISTS "Admins can manage app_config" ON public.app_config;
CREATE POLICY "Admins can manage app_config" ON public.app_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Política para api_keys
DROP POLICY IF EXISTS "Admins can manage api_keys" ON public.api_keys;
CREATE POLICY "Admins can manage api_keys" ON public.api_keys
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Política para documents
DROP POLICY IF EXISTS "Admins can manage documents" ON public.documents;
CREATE POLICY "Admins can manage documents" ON public.documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Política para heresy_responses
DROP POLICY IF EXISTS "Admins can manage heresy_responses" ON public.heresy_responses;
CREATE POLICY "Admins can manage heresy_responses" ON public.heresy_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Verificar se as colunas foram adicionadas
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'admin_id'
ORDER BY table_name;

-- Limpar função temporária
DROP FUNCTION IF EXISTS column_exists(text, text);
