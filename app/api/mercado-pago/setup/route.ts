import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // SQL para criar as tabelas do Mercado Pago
    const createTablesSQL = `
      -- Tabela de configurações do Mercado Pago
      CREATE TABLE IF NOT EXISTS mercado_pago_config (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        access_token TEXT NOT NULL,
        public_key TEXT NOT NULL,
        client_id TEXT,
        client_secret TEXT,
        webhook_url TEXT,
        sandbox_mode BOOLEAN DEFAULT true,
        active BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Tabela de produtos do Mercado Pago
      CREATE TABLE IF NOT EXISTS mercado_pago_products (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        external_id TEXT UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        currency_id TEXT DEFAULT 'BRL',
        category_id TEXT,
        picture_url TEXT,
        active BOOLEAN DEFAULT true,
        subscription_type TEXT CHECK (subscription_type IN ('monthly', 'yearly', 'one_time')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Tabela de transações do Mercado Pago
      CREATE TABLE IF NOT EXISTS mercado_pago_transactions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        payment_id TEXT UNIQUE NOT NULL,
        preference_id TEXT,
        user_id UUID REFERENCES auth.users(id),
        product_id UUID REFERENCES mercado_pago_products(id),
        amount DECIMAL(10,2) NOT NULL,
        currency_id TEXT DEFAULT 'BRL',
        status TEXT NOT NULL,
        status_detail TEXT,
        payment_method_id TEXT,
        payment_type_id TEXT,
        external_reference TEXT,
        description TEXT,
        payer_email TEXT,
        payer_id TEXT,
        collector_id TEXT,
        date_created TIMESTAMP WITH TIME ZONE,
        date_approved TIMESTAMP WITH TIME ZONE,
        date_last_updated TIMESTAMP WITH TIME ZONE,
        webhook_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Atualizar tabela de configuração do sistema de pagamento
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_system_config' AND column_name = 'mercado_pago_enabled') THEN
          ALTER TABLE payment_system_config ADD COLUMN mercado_pago_enabled BOOLEAN DEFAULT false;
        END IF;
      END $$;

      -- Criar índices
      CREATE INDEX IF NOT EXISTS idx_mercado_pago_products_external_id ON mercado_pago_products(external_id);
      CREATE INDEX IF NOT EXISTS idx_mercado_pago_products_active ON mercado_pago_products(active);
      CREATE INDEX IF NOT EXISTS idx_mercado_pago_transactions_payment_id ON mercado_pago_transactions(payment_id);
      CREATE INDEX IF NOT EXISTS idx_mercado_pago_transactions_user_id ON mercado_pago_transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_mercado_pago_transactions_status ON mercado_pago_transactions(status);
      CREATE INDEX IF NOT EXISTS idx_mercado_pago_transactions_date_created ON mercado_pago_transactions(date_created);

      -- Função para atualizar updated_at
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Triggers para updated_at
      DROP TRIGGER IF EXISTS update_mercado_pago_config_updated_at ON mercado_pago_config;
      CREATE TRIGGER update_mercado_pago_config_updated_at
        BEFORE UPDATE ON mercado_pago_config
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_mercado_pago_products_updated_at ON mercado_pago_products;
      CREATE TRIGGER update_mercado_pago_products_updated_at
        BEFORE UPDATE ON mercado_pago_products
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_mercado_pago_transactions_updated_at ON mercado_pago_transactions;
      CREATE TRIGGER update_mercado_pago_transactions_updated_at
        BEFORE UPDATE ON mercado_pago_transactions
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `

    // Executar o SQL
    const { error: sqlError } = await getSupabaseAdmin().rpc('exec_sql', { 
      sql_query: createTablesSQL 
    })

    if (sqlError) {
      console.error('Erro ao executar SQL:', sqlError)
      return NextResponse.json(
        { error: 'Erro ao criar tabelas', details: sqlError.message },
        { status: 500 }
      )
    }

    // Verificar se as tabelas foram criadas
    const { data: tables, error: checkError } = await getSupabaseAdmin()
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', [
        'mercado_pago_config',
        'mercado_pago_products', 
        'mercado_pago_transactions'
      ])

    if (checkError) {
      console.error('Erro ao verificar tabelas:', checkError)
    }

    // Inserir configuração padrão do sistema de pagamento se não existir
    const { data: existingConfig } = await getSupabaseAdmin()
      .from('payment_system_config')
      .select('id')
      .limit(1)

    if (!existingConfig || existingConfig.length === 0) {
      const { error: configError } = await getSupabaseAdmin()
        .from('payment_system_config')
        .insert({
          active_system: 'abacate_pay',
          abacate_pay_enabled: true,
          mercado_pago_enabled: false
        })

      if (configError) {
        console.error('Erro ao inserir configuração padrão:', configError)
      }
    }

    // Inserir produtos de exemplo
    const { data: existingProducts } = await getSupabaseAdmin()
      .from('mercado_pago_products')
      .select('id')
      .limit(1)

    if (!existingProducts || existingProducts.length === 0) {
      const sampleProducts = [
        {
          external_id: 'plano-mensal-premium',
          title: 'Plano Mensal Premium',
          description: 'Acesso completo ao chat espiritual por 1 mês',
          price: 19.90,
          subscription_type: 'monthly',
          active: true
        },
        {
          external_id: 'plano-anual-premium',
          title: 'Plano Anual Premium',
          description: 'Acesso completo ao chat espiritual por 1 ano (2 meses grátis)',
          price: 199.00,
          subscription_type: 'yearly',
          active: true
        }
      ]

      const { error: productsError } = await getSupabaseAdmin()
        .from('mercado_pago_products')
        .insert(sampleProducts)

      if (productsError) {
        console.error('Erro ao inserir produtos de exemplo:', productsError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Tabelas do Mercado Pago criadas com sucesso',
      tables: tables?.map(t => t.table_name) || []
    })

  } catch (error) {
    console.error('Erro no setup do Mercado Pago:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}