const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wlwwgnimfuvoxjecdnza.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsd3dnbmltZnV2b3hqZWNkbnphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA1NDE1NSwiZXhwIjoyMDY4NjMwMTU1fQ.QVP0bakGv0s0A7HktAvZgiBWoNvNpIkitAWzC2BMjfE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPaymentTransactionsTable() {
  try {
    console.log('🔄 Verificando se a tabela payment_transactions existe...');
    
    // Primeiro, vamos verificar se a tabela já existe
    const { data: testData, error: testError } = await supabase
      .from('payment_transactions')
      .select('id')
      .limit(1);
    
    if (testError && testError.code === '42P01') {
      console.log('❌ Tabela payment_transactions não existe');
      console.log('📝 A tabela precisa ser criada manualmente no Supabase SQL Editor');
      console.log('');
      console.log('Execute o seguinte SQL no Supabase:');
      console.log('');
      console.log(`CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.subscription_plans(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'BRL',
    payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'pix', 'manual', 'abacate_pay')),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    stripe_payment_intent_id TEXT,
    pix_qr_code TEXT,
    pix_qr_code_expires_at TIMESTAMP WITH TIME ZONE,
    tokens_granted INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Criar políticas
CREATE POLICY "Users can view own transactions" ON public.payment_transactions
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage transactions" ON public.payment_transactions
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(payment_status);`);
      
    } else if (testError) {
      console.log('❌ Erro ao verificar tabela:', testError.message);
    } else {
      console.log('✅ Tabela payment_transactions já existe e está acessível!');
      
      // Verificar estrutura da tabela
      const { data: columns, error: columnsError } = await supabase
        .rpc('get_table_columns', { table_name: 'payment_transactions' });
      
      if (!columnsError && columns) {
        console.log('📋 Colunas da tabela:', columns.map(c => c.column_name).join(', '));
      }
    }
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

createPaymentTransactionsTable();