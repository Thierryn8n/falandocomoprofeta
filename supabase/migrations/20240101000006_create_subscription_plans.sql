-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_type VARCHAR(50) UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (plan_type, price, features) VALUES
('monthly', 29.90, '["Acesso ilimitado por 30 dias", "Suporte prioritário", "Todas as funcionalidades"]'),
('yearly', 299.90, '["Acesso ilimitado por 365 dias", "Suporte prioritário", "Todas as funcionalidades", "2 meses grátis"]'),
('lifetime', 999.90, '["Acesso vitalício", "Suporte prioritário", "Todas as funcionalidades", "Atualizações futuras incluídas"]')
ON CONFLICT (plan_type) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at (drop if exists first)
DROP TRIGGER IF EXISTS subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_plans_updated_at();

-- Add RLS policies
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Allow public read access to subscription plans
CREATE POLICY "Allow public read access to subscription plans" ON subscription_plans
  FOR SELECT USING (true);

-- Allow admin users to manage subscription plans
CREATE POLICY "Allow admin users to manage subscription plans" ON subscription_plans
  FOR ALL USING (public.is_admin(auth.uid()));