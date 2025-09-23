-- Cria um schema privado para armazenar funções de segurança (SECURITY DEFINER)
-- Funções SECURITY DEFINER não devem ser expostas via API.
CREATE SCHEMA IF NOT EXISTS private;

-- Função para criar um perfil para um novo usuário na tabela public.profiles
-- Esta função é SECURITY DEFINER, o que significa que ela é executada com os privilégios
-- do usuário que a criou (geralmente 'postgres'), ignorando as políticas RLS para esta operação.
CREATE OR REPLACE FUNCTION private.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Insere um novo registro na tabela public.profiles
  INSERT INTO public.profiles (id, email, name, avatar_url, role, status)
  VALUES (
    NEW.id, -- O ID do novo usuário da tabela auth.users
    NEW.email, -- O email do novo usuário
    NEW.raw_user_meta_data->>'name', -- O nome do usuário, se fornecido nos metadados
    NEW.raw_user_meta_data->>'avatar_url', -- A URL do avatar, se fornecida nos metadados
    CASE
      -- Verifica se este é o primeiro perfil a ser criado.
      -- Se sim, atribui a role 'admin', caso contrário, 'user'.
      WHEN (SELECT count(*) FROM public.profiles) = 0 THEN 'admin'
      ELSE 'user'
    END,
    'active' -- Define o status inicial como 'active'
  );
  RETURN NEW; -- Retorna o novo registro para continuar a operação de inserção em auth.users
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cria um trigger na tabela auth.users
-- Este trigger é acionado APÓS a inserção de um novo usuário em auth.users
-- Para cada linha inserida, ele executa a função private.handle_new_user_profile()
CREATE TRIGGER on_auth_user_created_create_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE private.handle_new_user_profile();
