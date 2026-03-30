-- Adicionar coluna waypoints (vértices da linha) e atualizar políticas
-- Execute no SQL Editor do Supabase

-- Adicionar coluna waypoints (array de pontos x,y)
alter table canvas_connections 
add column if not exists waypoints jsonb default null;

-- Adicionar coluna end_cap (tipo de ponta)
alter table canvas_connections 
add column if not exists end_cap text default null;

-- Adicionar colunas de estilo visual se não existirem
alter table canvas_connections 
add column if not exists stroke_width decimal(4,2) default 2.5;

alter table canvas_connections 
add column if not exists stroke_color text default '#737373';

alter table canvas_connections 
add column if not exists dash_style text default 'solid';

alter table canvas_connections 
add column if not exists from_side text default null;

alter table canvas_connections 
add column if not exists to_side text default null;

-- Criar política de update se não existir
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'canvas_connections' 
    and policyname = 'Users can update their own canvas connections'
  ) then
    create policy "Users can update their own canvas connections"
      on canvas_connections for update
      using (auth.uid() = (select user_id from bible_study_panels where id = panel_id));
  end if;
end $$;
