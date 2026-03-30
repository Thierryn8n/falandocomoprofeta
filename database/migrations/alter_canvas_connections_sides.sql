-- Ancoragem das linhas nas bordas dos cards (n/e/s/w). Opcional; NULL = centro (comportamento antigo).

alter table canvas_connections add column if not exists from_side text;
alter table canvas_connections add column if not exists to_side text;
