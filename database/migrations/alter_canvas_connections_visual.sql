-- Estilo visual por conexão (espessura, cor, tracejado, ponta).
-- Execute no SQL Editor do Supabase se ainda não existir.

alter table canvas_connections add column if not exists stroke_width real;
alter table canvas_connections add column if not exists stroke_color text;
alter table canvas_connections add column if not exists dash_style text;
alter table canvas_connections add column if not exists end_cap text;
