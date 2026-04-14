-- =====================================================
-- RLS COMPLETO PARA TODO O APP - FALANDO COMO PROFETA
-- =====================================================
-- Este script habilita Row Level Security (RLS) em todas as tabelas
-- e cria políticas seguras para cada uma

-- =====================================================
-- 1. TABELAS DE USUÁRIOS E PERFIS
-- =====================================================

-- Profiles: Usuários só veem e editam seu próprio perfil
-- Admins podem ver todos os perfis
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 2. TABELAS DE CHAT E CONVERSAS
-- =====================================================

-- Conversations: Usuários só veem suas próprias conversas
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;

CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.conversations
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversations" ON public.conversations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Messages: Usuários só veem mensagens de suas conversas
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages from own conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;

CREATE POLICY "Users can view messages from own conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in own conversations" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own messages" ON public.messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own messages" ON public.messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all messages" ON public.messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Message Attachments: Usuários só veem anexos de suas mensagens
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own attachments" ON public.message_attachments;
DROP POLICY IF EXISTS "Users can insert their own attachments" ON public.message_attachments;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON public.message_attachments;

CREATE POLICY "Users can view their own attachments" ON public.message_attachments
    FOR SELECT USING (
        message_id IN (
            SELECT m.id FROM public.messages m
            JOIN public.conversations c ON m.conversation_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own attachments" ON public.message_attachments
    FOR INSERT WITH CHECK (
        message_id IN (
            SELECT m.id FROM public.messages m
            JOIN public.conversations c ON m.conversation_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own attachments" ON public.message_attachments
    FOR DELETE USING (
        message_id IN (
            SELECT m.id FROM public.messages m
            JOIN public.conversations c ON m.conversation_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );

-- =====================================================
-- 3. TABELAS DE DOCUMENTOS E CONHECIMENTO
-- =====================================================

-- Documents: Apenas admins podem gerenciar documentos
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can manage documents" ON public.documents;

CREATE POLICY "Public can view documents" ON public.documents
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage documents" ON public.documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 4. TABELAS DE CONFIGURAÇÃO DO APP
-- =====================================================

-- App Config: Leitura pública, modificação apenas por admins
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access for app config" ON public.app_config;
DROP POLICY IF EXISTS "Admin can manage app config" ON public.app_config;

CREATE POLICY "Public read access for app config" ON public.app_config
    FOR SELECT TO public USING (true);

CREATE POLICY "Admin can manage app config" ON public.app_config
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- =====================================================
-- 5. TABELAS DE API KEYS (ADMIN ONLY)
-- =====================================================

-- API Keys: Apenas admins podem acessar
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage api keys" ON public.api_keys;

CREATE POLICY "Admins can manage api keys" ON public.api_keys
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 6. TABELAS DE ASSINATURAS
-- =====================================================

-- User Subscriptions: Usuários só veem suas próprias assinaturas
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.user_subscriptions;

CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own subscriptions" ON public.user_subscriptions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions" ON public.user_subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Subscription Plans: Leitura pública, modificação apenas por admins
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Admins can manage subscription plans" ON public.subscription_plans;

CREATE POLICY "Public can view subscription plans" ON public.subscription_plans
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage subscription plans" ON public.subscription_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 7. TABELAS DE ANÁLISE E LOGS
-- =====================================================

-- Analytics: Apenas admins
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view analytics" ON public.analytics;

CREATE POLICY "Admins can view analytics" ON public.analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- System Logs: Apenas admins
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view system logs" ON public.system_logs;

CREATE POLICY "Admins can view system logs" ON public.system_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 8. TABELAS DE HERESIA (MODERAÇÃO)
-- =====================================================

-- Heresy Logs: Apenas admins
ALTER TABLE public.heresy_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view heresy logs" ON public.heresy_logs;

CREATE POLICY "Admins can view heresy logs" ON public.heresy_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Heresy Responses: Leitura pública, modificação apenas por admins
ALTER TABLE public.heresy_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view heresy responses" ON public.heresy_responses;
DROP POLICY IF EXISTS "Admins can manage heresy responses" ON public.heresy_responses;

CREATE POLICY "Public can view heresy responses" ON public.heresy_responses
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage heresy responses" ON public.heresy_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- 9. TABELAS DE BIBLE STUDY (ESTUDOS BÍBLICOS)
-- =====================================================

-- Bible Study Panels: Usuários só veem seus próprios painéis
ALTER TABLE public.bible_study_panels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own panels" ON public.bible_study_panels;
DROP POLICY IF EXISTS "Users can create own panels" ON public.bible_study_panels;
DROP POLICY IF EXISTS "Users can update own panels" ON public.bible_study_panels;
DROP POLICY IF EXISTS "Users can delete own panels" ON public.bible_study_panels;

CREATE POLICY "Users can view own panels" ON public.bible_study_panels
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own panels" ON public.bible_study_panels
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own panels" ON public.bible_study_panels
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own panels" ON public.bible_study_panels
    FOR DELETE USING (auth.uid() = user_id);

-- Canvas Elements: Usuários só veem elementos de seus painéis
ALTER TABLE public.canvas_elements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own canvas elements" ON public.canvas_elements;
DROP POLICY IF EXISTS "Users can create own canvas elements" ON public.canvas_elements;
DROP POLICY IF EXISTS "Users can update own canvas elements" ON public.canvas_elements;
DROP POLICY IF EXISTS "Users can delete own canvas elements" ON public.canvas_elements;

CREATE POLICY "Users can view own canvas elements" ON public.canvas_elements
    FOR SELECT USING (
        auth.uid() = (SELECT user_id FROM public.bible_study_panels WHERE id = panel_id)
    );

CREATE POLICY "Users can create own canvas elements" ON public.canvas_elements
    FOR INSERT WITH CHECK (
        auth.uid() = (SELECT user_id FROM public.bible_study_panels WHERE id = panel_id)
    );

CREATE POLICY "Users can update own canvas elements" ON public.canvas_elements
    FOR UPDATE USING (
        auth.uid() = (SELECT user_id FROM public.bible_study_panels WHERE id = panel_id)
    );

CREATE POLICY "Users can delete own canvas elements" ON public.canvas_elements
    FOR DELETE USING (
        auth.uid() = (SELECT user_id FROM public.bible_study_panels WHERE id = panel_id)
    );

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Listar todas as tabelas com RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true
ORDER BY tablename;

-- Listar todas as políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
