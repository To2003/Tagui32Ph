-- Tagui32 — esquema de base de datos
-- Pegar entero en el SQL Editor de Supabase (Project > SQL Editor > New query) y ejecutar.
-- Es idempotente: se puede volver a correr sin romper nada si ya existe.

create extension if not exists pgcrypto;

-- ============================================================================
-- TABLAS
-- ============================================================================

-- Solicitudes de cobertura y eventos ya realizados.
-- Una fila recorre todo el ciclo: solicitud -> confirmado -> fotos subidas -> pagado.
create table if not exists eventos (
  id                  uuid primary key default gen_random_uuid(),
  -- Datos de la solicitud
  deporte             text not null,
  equipo              text not null,
  fecha_partido       timestamptz not null,
  lugar               text not null,
  duracion_horas      numeric(3,1),
  cantidad_jugadores  int,
  notas               text,
  -- Contacto del responsable
  contacto_nombre     text not null,
  contacto_email      text not null,
  contacto_whatsapp   text not null,
  -- Estado y plata
  estado              text not null default 'pendiente'
    constraint eventos_estado_check
    check (estado in ('pendiente', 'confirmado', 'rechazado', 'fotos_subidas', 'pagado', 'vencido')),
  precio_centavos     int not null,      -- se precarga con el precio base, editable
  zip_key             text,              -- clave del ZIP de originales en R2
  zip_bytes           bigint,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Previews con marca de agua que ve el cliente en la galería.
create table if not exists fotos (
  id          uuid primary key default gen_random_uuid(),
  evento_id   uuid not null references eventos(id) on delete cascade,
  preview_key text not null,             -- clave en R2
  ancho       int,
  alto        int,
  orden       int not null default 0,
  created_at  timestamptz not null default now()
);

-- Código con el que el equipo entra a ver y comprar su pack.
create table if not exists codigos_acceso (
  id         uuid primary key default gen_random_uuid(),
  evento_id  uuid not null references eventos(id) on delete cascade,
  codigo     text not null unique,       -- 8 caracteres, alfabeto sin ambiguos
  expira_en  timestamptz not null,       -- generación + 30 días
  usos       int not null default 0,
  created_at timestamptz not null default now()
);

-- Registro de pagos de Mercado Pago. Sirve de log y de defensa anti-duplicados.
create table if not exists pagos (
  id                uuid primary key default gen_random_uuid(),
  evento_id         uuid not null references eventos(id),
  mp_payment_id     text not null unique,   -- unique = protección contra webhooks repetidos
  mp_preference_id  text,
  monto_centavos    int not null,
  estado            text not null
    constraint pagos_estado_check
    check (estado in ('approved', 'pending', 'rejected', 'refunded')),
  payload           jsonb,                  -- respuesta cruda de MP, para auditar
  created_at        timestamptz not null default now()
);

-- Fotos de ejemplo de la home. Separadas del resto a propósito.
create table if not exists portfolio (
  id         uuid primary key default gen_random_uuid(),
  imagen_key text not null,
  titulo     text,
  deporte    text,
  orden      int not null default 0,
  visible    boolean not null default true,
  created_at timestamptz not null default now()
);

-- Configuración editable sin tocar código (precio base, textos, contacto).
create table if not exists configuracion (
  clave  text primary key,
  valor  text not null
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

create index if not exists idx_fotos_evento_id on fotos(evento_id);
create index if not exists idx_codigos_acceso_evento_id on codigos_acceso(evento_id);
create index if not exists idx_codigos_acceso_expira_en on codigos_acceso(expira_en);
create index if not exists idx_pagos_evento_id on pagos(evento_id);
create index if not exists idx_eventos_estado on eventos(estado);
create index if not exists idx_portfolio_orden on portfolio(orden);

-- ============================================================================
-- updated_at automático en eventos
-- ============================================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_eventos_updated_at on eventos;
create trigger trg_eventos_updated_at
  before update on eventos
  for each row
  execute function set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
--
-- Ninguna tabla tiene policies: RLS activo + cero policies = acceso denegado
-- por completo a los roles `anon` y `authenticated` (los que usa el cliente
-- del navegador). El único acceso es el del servidor con la
-- SUPABASE_SERVICE_ROLE_KEY, cuyo rol de Postgres (`service_role`) tiene
-- BYPASSRLS y no necesita policies. Todo el acceso a datos pasa por API
-- routes del servidor, nunca directo desde el navegador.
-- ============================================================================

alter table eventos enable row level security;
alter table fotos enable row level security;
alter table codigos_acceso enable row level security;
alter table pagos enable row level security;
alter table portfolio enable row level security;
alter table configuracion enable row level security;

-- ============================================================================
-- CONFIGURACIÓN INICIAL
-- ============================================================================

insert into configuracion (clave, valor) values
  ('precio_base_centavos', '1500000'),
  ('contacto_whatsapp', '5490000000000'),
  ('contacto_email', 'hola@tagui32.com')
on conflict (clave) do nothing;
