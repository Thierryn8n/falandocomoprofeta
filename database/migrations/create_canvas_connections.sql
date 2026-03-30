-- Conexões entre elementos de canvas_elements (Modo Miro), com estilo de linha.
-- Execute no SQL Editor do Supabase se ainda não existir a tabela.

create table if not exists canvas_connections (
  id uuid primary key default gen_random_uuid(),
  panel_id uuid not null references bible_study_panels(id) on delete cascade,
  from_element_id uuid not null,
  to_element_id uuid not null,
  line_style text not null default 'straight',
  label text,
  created_at timestamptz default now(),
  unique(panel_id, from_element_id, to_element_id)
);

create index if not exists idx_canvas_connections_panel on canvas_connections(panel_id);

alter table canvas_connections enable row level security;

create policy "Users can view their own canvas connections"
  on canvas_connections for select
  using (auth.uid() = (select user_id from bible_study_panels where id = panel_id));

create policy "Users can insert their own canvas connections"
  on canvas_connections for insert
  with check (auth.uid() = (select user_id from bible_study_panels where id = panel_id));

create policy "Users can delete their own canvas connections"
  on canvas_connections for delete
  using (auth.uid() = (select user_id from bible_study_panels where id = panel_id));
