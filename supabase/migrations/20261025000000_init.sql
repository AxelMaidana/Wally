-- Esquema inicial de Wally (migrado desde Firestore)
-- Colecciones originales: users -> profiles, messages -> transactions

-- =========================================================
-- Perfiles de usuario
-- =========================================================
create table public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    email text,
    display_name text not null default '',
    photo_url text not null default '',
    role text not null default 'client' check (role in ('client', 'admin')),
    telegram_token text,
    created_at timestamptz not null default now(),
    updated_at timestamptz
);

-- Crea el perfil automáticamente cuando se registra un usuario
-- (reemplaza a syncUserToFirestore del frontend)
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
    insert into public.profiles (id, email, display_name, photo_url)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
        coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', '')
    );
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- Helper para las políticas: ¿el usuario actual es admin?
create function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
    select exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and role = 'admin'
    );
$$;

alter table public.profiles enable row level security;

create policy "Cada usuario ve su perfil; los admin ven todos"
    on public.profiles for select
    to authenticated
    using (id = (select auth.uid()) or public.is_admin());

create policy "Cada usuario edita su perfil"
    on public.profiles for update
    to authenticated
    using (id = (select auth.uid()))
    with check (id = (select auth.uid()));

-- El usuario solo puede cambiar estas columnas (nunca su propio rol)
revoke update on public.profiles from authenticated;
grant update (display_name, photo_url, telegram_token, updated_at)
    on public.profiles to authenticated;

-- =========================================================
-- Transacciones (gastos e ingresos)
-- =========================================================
create table public.transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    monto numeric(14, 2) not null,
    descripcion text not null default '',
    tipo text not null check (tipo in ('gasto', 'ingreso')),
    categoria text not null default 'otros',
    fecha text not null default 'hoy',
    created_at timestamptz not null default now()
);

create index transactions_user_created_idx
    on public.transactions (user_id, created_at desc);

alter table public.transactions enable row level security;

create policy "Cada usuario ve sus transacciones"
    on public.transactions for select
    to authenticated
    using (user_id = (select auth.uid()));

create policy "Cada usuario crea sus transacciones"
    on public.transactions for insert
    to authenticated
    with check (user_id = (select auth.uid()));

create policy "Cada usuario edita sus transacciones"
    on public.transactions for update
    to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));

create policy "Cada usuario borra sus transacciones"
    on public.transactions for delete
    to authenticated
    using (user_id = (select auth.uid()));

-- =========================================================
-- Tiempo real (reemplaza onSnapshot de Firestore)
-- =========================================================
alter publication supabase_realtime add table public.profiles, public.transactions;
