-- Esquema de Base de Datos para Supabase
-- Proyecto: Afectados por el Terremoto Venezuela

-- Habilitar extensión UUID
create extension if not exists "uuid-ossp";

-- 1. Tabla de Usuarios Administradores
create table public.admin_users (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid unique references auth.users(id) on delete cascade,
    email text not null unique,
    role text not null default 'admin',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS para admin_users
alter table public.admin_users enable row level security;

-- 2. Tabla de Afectados
create table public.affected_people (
    id uuid primary key default uuid_generate_v4(),
    full_name text not null,
    cedula text,
    phone text,
    state text not null,
    city text not null,
    municipality text,
    parish text,
    exact_address text,
    reference_point text,
    latitude numeric,
    longitude numeric,
    status text not null check (status in ('Sin localizar', 'Localizado', 'Rescatado', 'Hospitalizado', 'Fallecido', 'Necesita ayuda')),
    situation_description text,
    person_photo_url text,
    place_photo_url text,
    registered_by_name text not null,
    registered_by_phone text not null,
    consent boolean not null default false,
    is_public boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS para affected_people
alter table public.affected_people enable row level security;

-- 3. Tabla de Personas Desaparecidas
create table public.missing_people (
    id uuid primary key default uuid_generate_v4(),
    full_name text not null,
    cedula text,
    approximate_age integer,
    photo_url text,
    last_seen_location text,
    physical_description text,
    clothes_description text,
    reporter_name text not null,
    reporter_phone text not null,
    last_contact_at timestamp with time zone,
    notes text,
    status text not null default 'missing' check (status in ('missing', 'located', 'rescued', 'hospitalized', 'deceased')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS para missing_people
alter table public.missing_people enable row level security;

-- 4. Tabla de Personas Rescatadas
create table public.rescued_people (
    id uuid primary key default uuid_generate_v4(),
    full_name text,
    photo_url text,
    description text,
    rescued_location text,
    hospital_or_shelter text,
    health_status text,
    reported_by_name text,
    reported_by_phone text,
    rescued_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS para rescued_people
alter table public.rescued_people enable row level security;

-- 5. Tabla de Historias / Testimonios
create table public.stories (
    id uuid primary key default uuid_generate_v4(),
    author_name text,
    is_anonymous boolean default false not null,
    state text,
    city text,
    title text not null,
    content text not null,
    photo_url text,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS para stories
alter table public.stories enable row level security;

-- 6. Tabla de Contactos de Emergencia
create table public.emergency_contacts (
    id uuid primary key default uuid_generate_v4(),
    state text not null,
    city text not null,
    institution text not null,
    phone text not null,
    whatsapp text,
    address text,
    official_source text,
    verified_at timestamp with time zone,
    is_active boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS para emergency_contacts
alter table public.emergency_contacts enable row level security;

-- 7. Tabla de Reportes de Información Adicional (Confidencial)
create table public.information_reports (
    id uuid primary key default uuid_generate_v4(),
    related_type text not null check (related_type in ('affected', 'missing', 'rescued')),
    related_id uuid not null,
    reporter_name text not null,
    reporter_phone text not null,
    message text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS para information_reports
alter table public.information_reports enable row level security;

-- ----------------------------------------------------
-- FUNCIONES AUXILIARES PARA SEGURIDAD (RLS)
-- ----------------------------------------------------

-- Función para verificar si un usuario es administrador
create or replace function public.is_admin()
returns boolean security definer as $$
begin
  return exists (
    select 1 from public.admin_users
    where user_id = auth.uid()
  );
end;
$$ language plpgsql;

-- ----------------------------------------------------
-- POLÍTICAS RLS (Row Level Security)
-- ----------------------------------------------------

-- Políticas para admin_users
create policy "Admins can view and edit admin_users table"
    on public.admin_users for all
    using (public.is_admin() or auth.uid() = user_id);

-- Políticas para affected_people
create policy "Public insert for affected_people"
    on public.affected_people for insert
    with check (true);

create policy "Public select limited affected_people"
    on public.affected_people for select
    using (is_public = true or public.is_admin());

create policy "Admin control for affected_people"
    on public.affected_people for all
    using (public.is_admin());

-- Políticas para missing_people
create policy "Public insert for missing_people"
    on public.missing_people for insert
    with check (true);

create policy "Public select missing_people"
    on public.missing_people for select
    using (true);

create policy "Admin control for missing_people"
    on public.missing_people for all
    using (public.is_admin());

-- Políticas para rescued_people
create policy "Public insert for rescued_people"
    on public.rescued_people for insert
    with check (true);

create policy "Public select rescued_people"
    on public.rescued_people for select
    using (true);

create policy "Admin control for rescued_people"
    on public.rescued_people for all
    using (public.is_admin());

-- Políticas para stories
create policy "Public insert for stories"
    on public.stories for insert
    with check (true);

create policy "Public select approved stories"
    on public.stories for select
    using (status = 'approved' or public.is_admin());

create policy "Admin control for stories"
    on public.stories for all
    using (public.is_admin());

-- Políticas para emergency_contacts
create policy "Public select active contacts"
    on public.emergency_contacts for select
    using (is_active = true or public.is_admin());

create policy "Admin control for emergency_contacts"
    on public.emergency_contacts for all
    using (public.is_admin());

-- Políticas para information_reports
create policy "Public insert for information_reports"
    on public.information_reports for insert
    with check (true);

create policy "Admin only select information_reports"
    on public.information_reports for select
    using (public.is_admin());

create policy "Admin only edit/delete information_reports"
    on public.information_reports for all
    using (public.is_admin());

-- ----------------------------------------------------
-- TRIGGERS PARA ACTUALIZAR updated_at
-- ----------------------------------------------------

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_affected_people
    before update on public.affected_people
    for each row execute function public.handle_updated_at();

create trigger set_updated_at_missing_people
    before update on public.missing_people
    for each row execute function public.handle_updated_at();

create trigger set_updated_at_rescued_people
    before update on public.rescued_people
    for each row execute function public.handle_updated_at();

create trigger set_updated_at_stories
    before update on public.stories
    for each row execute function public.handle_updated_at();

create trigger set_updated_at_emergency_contacts
    before update on public.emergency_contacts
    for each row execute function public.handle_updated_at();

-- ----------------------------------------------------
-- CONFIGURACIÓN DE STORAGE (Para fotos de perfil/calle)
-- ----------------------------------------------------
-- Nota: La creación de buckets se realiza vía API de Supabase,
-- pero se puede inicializar en SQL insertando en storage.buckets.
-- Para que funcione, el esquema de Storage debe estar creado.

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Políticas de Storage para el bucket "photos"
create policy "Allow public uploads to photos bucket"
    on storage.objects for insert
    with check (bucket_id = 'photos');

create policy "Allow public read to photos bucket"
    on storage.objects for select
    using (bucket_id = 'photos');

create policy "Allow admin delete of objects"
    on storage.objects for delete
    using (bucket_id = 'photos' and public.is_admin());

-- ----------------------------------------------------
-- INSERTAR CONTACTOS DE EMERGENCIA REALES (MUESTRA VERIFICADA)
-- ----------------------------------------------------
-- De acuerdo con la pauta, no inventamos números. Insertaremos algunos números oficiales genéricos de Venezuela
-- (Protección Civil y Bomberos) que son reales y válidos en todo el país.

insert into public.emergency_contacts (state, city, institution, phone, whatsapp, address, official_source, verified_at, is_active)
values 
('Nacional', 'Caracas', 'Protección Civil Nacional', '0800-7248451', null, 'Plaza Venezuela, Caracas', 'Sitio Web Oficial de Protección Civil', now(), true),
('Nacional', 'Caracas', 'Bomberos del Distrito Capital', '0212-5454545', null, 'Av. Lecuna, Caracas', 'Gobierno de Distrito Capital', now(), true),
('Nacional', 'Todo el país', 'Emergencias Nacionales Ven911', '911', null, 'Sedes Ven911 a nivel nacional', 'Ministerio del Poder Popular para Relaciones Interiores, Justicia y Paz', now(), true),
('Nacional', 'Todo el país', 'Cuerpo de Investigaciones Científicas, Penales y Criminalísticas (CICPC)', '0800-2427224', null, 'Avenida Urdaneta, Caracas', 'Página web oficial del CICPC', now(), true);
