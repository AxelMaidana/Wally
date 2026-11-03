-- El bot ahora guarda una observación opcional además del motivo (descripcion).
-- La fecha del movimiento va en created_at, que es lo que usan los listados;
-- fecha pasa a guardar el día en formato YYYY-MM-DD.
alter table public.transactions
    add column observacion text not null default '';
