-- Create canvas_elements table for Miro-style Bible study canvas
create table if not exists canvas_elements (
  id uuid primary key default uuid_generate_v4(),
  panel_id uuid not null references bible_study_panels(id) on delete cascade,
  type text not null, -- 'sticky' | 'frame' | 'table' | 'image' | 'doc'
  text text,
  color text,
  x integer not null,
  y integer not null,
  width integer default 180,
  height integer default 180,
  data jsonb, -- versículos, revelações, etc.
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Índice para performance
create index if not exists idx_canvas_panel on canvas_elements(panel_id);

-- RLS policies
alter table canvas_elements enable row level security;

create policy "Users can view their own canvas elements"
  on canvas_elements for select
  using (auth.uid() = (select user_id from bible_study_panels where id = panel_id));

create policy "Users can insert their own canvas elements"
  on canvas_elements for insert
  with check (auth.uid() = (select user_id from bible_study_panels where id = panel_id));

create policy "Users can update their own canvas elements"
  on canvas_elements for update
  using (auth.uid() = (select user_id from bible_study_panels where id = panel_id));

create policy "Users can delete their own canvas elements"
  on canvas_elements for delete
  using (auth.uid() = (select user_id from bible_study_panels where id = panel_id));
