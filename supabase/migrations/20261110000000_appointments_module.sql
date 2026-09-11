-- ============================================================================
-- Nimbus SaaS — Appointment & Reservation System Module
-- ----------------------------------------------------------------------------
-- Adds the booking schema (services, availability_slots, appointments) with
-- strict multi-tenant Row Level Security and database-level double-booking
-- prevention.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SERVICES
-- A bookable offering scoped to a tenant. `price` is stored in minor currency
-- units (e.g. cents) for Stripe compatibility. `duration_minutes` determines
-- how long a booking blocks a slot on the calendar.
-- ----------------------------------------------------------------------------
create table public.services (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  name             text not null,
  description      text,
  duration_minutes integer not null default 30 check (duration_minutes > 0),
  price            integer not null default 0 check (price >= 0),
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- AVAILABILITY_SLOTS
-- Recurring weekly availability windows. `day_of_week` follows PostgreSQL's
-- convention (0 = Sunday ... 6 = Saturday, matching extract(dow ...)).
-- `start_time` / `end_time` are local wall-clock times (time without tz).
-- ----------------------------------------------------------------------------
create table public.availability_slots (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  day_of_week     integer not null check (day_of_week between 0 and 6),
  start_time      time not null,
  end_time        time not null,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  check (end_time > start_time),
  unique (organization_id, day_of_week, start_time, end_time)
);

-- ----------------------------------------------------------------------------
-- APPOINTMENTS
-- A concrete booking. Lifecycle: pending -> confirmed (after payment) ->
-- completed; or cancelled. `stripe_payment_intent_id` links to the deposit.
-- ----------------------------------------------------------------------------
create table public.appointments (
  id                       uuid primary key default gen_random_uuid(),
  organization_id          uuid not null references public.organizations (id) on delete cascade,
  service_id               uuid not null references public.services (id) on delete restrict,
  customer_name            text not null,
  customer_email           text not null,
  customer_phone           text,
  start_time               timestamptz not null,
  end_time                 timestamptz not null,
  status                   text not null default 'pending'
                           check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  stripe_payment_intent_id text,
  created_at               timestamptz not null default now(),
  check (end_time > start_time)
);

-- ----------------------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------------------
create index idx_services_organization_id on public.services (organization_id);

create index idx_availability_slots_organization_id
  on public.availability_slots (organization_id, day_of_week, is_active);

-- Fast lookup of a tenant's appointments by time, status, and service.
create index idx_appointments_organization_time
  on public.appointments (organization_id, start_time, end_time);
create index idx_appointments_organization_status
  on public.appointments (organization_id, status);
create index idx_appointments_service_id on public.appointments (service_id);

-- A given Stripe payment intent can confirm at most one appointment.
create unique index idx_appointments_payment_intent_unique
  on public.appointments (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

-- ----------------------------------------------------------------------------
-- HELPERS: keep `updated_at` current on services
-- ----------------------------------------------------------------------------
create trigger trg_services_updated_at
  before update on public.services
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------------------
-- DOUBLE-BOOKING PREVENTION
-- A status-aware trigger rejects overlapping non-cancelled appointments for
-- the same tenant. A trigger (rather than an exclusion constraint) is used
-- because PostgreSQL does not support partial exclusion constraints, and a
-- cancelled appointment must release its slot for re-booking.
--
-- The trigger first takes a row lock on the organization to serialize
-- concurrent bookings for the same tenant, then scans for conflicting rows.
-- ----------------------------------------------------------------------------
create or replace function public.prevent_appointment_overlap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Serialize concurrent bookings for this tenant.
  perform 1 from public.organizations where id = new.organization_id for update;

  if exists (
    select 1
    from public.appointments a
    where a.organization_id = new.organization_id
      and a.id is distinct from new.id
      and a.status <> 'cancelled'
      and a.start_time < new.end_time
      and new.start_time < a.end_time
  ) then
    raise exception 'Appointment time conflicts with an existing booking';
  end if;

  return new;
end;
$$;

create trigger trg_appointments_no_overlap
  before insert or update on public.appointments
  for each row execute procedure public.prevent_appointment_overlap();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Every policy is scoped to the caller's membership via `is_org_member`.
-- The customer-facing booking flow uses the service-role client for anonymous
-- visitors; these policies protect authenticated member access.
-- ----------------------------------------------------------------------------
alter table public.services enable row level security;
create policy "services_select_member"
  on public.services for select
  using (public.is_org_member(organization_id));
create policy "services_insert_member"
  on public.services for insert
  with check (public.is_org_member(organization_id));
create policy "services_update_member"
  on public.services for update
  using (public.is_org_member(organization_id));
create policy "services_delete_member"
  on public.services for delete
  using (public.is_org_member(organization_id));

alter table public.availability_slots enable row level security;
create policy "availability_slots_select_member"
  on public.availability_slots for select
  using (public.is_org_member(organization_id));
create policy "availability_slots_insert_member"
  on public.availability_slots for insert
  with check (public.is_org_member(organization_id));
create policy "availability_slots_update_member"
  on public.availability_slots for update
  using (public.is_org_member(organization_id));
create policy "availability_slots_delete_member"
  on public.availability_slots for delete
  using (public.is_org_member(organization_id));

alter table public.appointments enable row level security;
create policy "appointments_select_member"
  on public.appointments for select
  using (public.is_org_member(organization_id));
create policy "appointments_insert_member"
  on public.appointments for insert
  with check (public.is_org_member(organization_id));
create policy "appointments_update_member"
  on public.appointments for update
  using (public.is_org_member(organization_id));
create policy "appointments_delete_member"
  on public.appointments for delete
  using (public.is_org_member(organization_id));

