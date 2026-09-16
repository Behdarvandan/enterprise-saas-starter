-- ============================================================================
-- Nimbus SaaS — Anonymous booking flow: SECURITY DEFINER RPCs
-- ----------------------------------------------------------------------------
-- The public booking flow (`/book/[org_slug]`, `/api/booking/slots`,
-- `/api/checkout/booking`) is anonymous by design, so it previously ran on
-- the service-role client and relied entirely on hand-written
-- `organization_id` filters in TypeScript for tenant isolation — with no
-- RLS backstop if one of those filters were ever dropped or mistyped.
--
-- These functions replace that: each takes `p_organization_id` as an
-- explicit parameter and applies it as a hard SQL predicate in a small,
-- reviewed function body. `anon` gets EXECUTE on these functions only —
-- never SELECT/INSERT/UPDATE on the underlying tables, which keep the
-- member-only RLS policies from earlier migrations unchanged.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- get_bookable_service
-- The active service a booking request is for, scoped to its organization.
-- ----------------------------------------------------------------------------
create or replace function public.get_bookable_service(
  p_organization_id uuid,
  p_service_id uuid
)
returns public.services
language sql
security definer
set search_path = public
stable
as $$
  select *
  from public.services
  where id = p_service_id
    and organization_id = p_organization_id
    and is_active = true
  limit 1;
$$;

revoke all on function public.get_bookable_service(uuid, uuid) from public;
grant execute on function public.get_bookable_service(uuid, uuid) to anon;

-- ----------------------------------------------------------------------------
-- get_organization_booking_info
-- The public-facing name/slug used to render the booking page and build
-- checkout success/cancel URLs.
-- ----------------------------------------------------------------------------
create or replace function public.get_organization_booking_info(
  p_organization_id uuid
)
returns table (name text, slug text)
language sql
security definer
set search_path = public
stable
as $$
  select o.name, o.slug
  from public.organizations o
  where o.id = p_organization_id;
$$;

revoke all on function public.get_organization_booking_info(uuid) from public;
grant execute on function public.get_organization_booking_info(uuid) to anon;

-- ----------------------------------------------------------------------------
-- is_organization_serviceable
-- Whether the organization's subscription allows the anonymous booking/chat
-- surfaces to run at all.
-- ----------------------------------------------------------------------------
create or replace function public.is_organization_serviceable(
  p_organization_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select o.subscription_status in ('active', 'trialing')
      from public.organizations o
      where o.id = p_organization_id
    ),
    false
  );
$$;

revoke all on function public.is_organization_serviceable(uuid) from public;
grant execute on function public.is_organization_serviceable(uuid) to anon;

-- ----------------------------------------------------------------------------
-- get_availability_windows
-- An organization's recurring weekly availability windows for one
-- day-of-week (0 = Sunday ... 6 = Saturday), used by the slot-generation
-- loop in `src/lib/booking.ts`.
-- ----------------------------------------------------------------------------
create or replace function public.get_availability_windows(
  p_organization_id uuid,
  p_day_of_week int
)
returns setof public.availability_slots
language sql
security definer
set search_path = public
stable
as $$
  select *
  from public.availability_slots
  where organization_id = p_organization_id
    and day_of_week = p_day_of_week
    and is_active = true;
$$;

revoke all on function public.get_availability_windows(uuid, int) from public;
grant execute on function public.get_availability_windows(uuid, int) to anon;

-- ----------------------------------------------------------------------------
-- get_appointment_conflicts
-- Non-cancelled appointments overlapping a time range, used to exclude
-- already-booked slots.
-- ----------------------------------------------------------------------------
create or replace function public.get_appointment_conflicts(
  p_organization_id uuid,
  p_range_start timestamptz,
  p_range_end timestamptz
)
returns table (start_time timestamptz, end_time timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select a.start_time, a.end_time
  from public.appointments a
  where a.organization_id = p_organization_id
    and a.status <> 'cancelled'
    and a.start_time < p_range_end
    and a.end_time > p_range_start;
$$;

revoke all on function public.get_appointment_conflicts(uuid, timestamptz, timestamptz) from public;
grant execute on function public.get_appointment_conflicts(uuid, timestamptz, timestamptz) to anon;

-- ----------------------------------------------------------------------------
-- create_pending_appointment
-- Validates the service is active and belongs to the organization, computes
-- `end_time` from its duration, and inserts a `pending` appointment. The
-- existing `prevent_appointment_overlap` trigger (unaffected by this
-- function's SECURITY DEFINER privilege) still rejects double-bookings with
-- SQLSTATE P0001; a missing/inactive service raises P0002 so callers can
-- tell the two failure modes apart, exactly as the TypeScript version did.
-- ----------------------------------------------------------------------------
create or replace function public.create_pending_appointment(
  p_organization_id uuid,
  p_service_id uuid,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_device_info text,
  p_issue_description text,
  p_start_time timestamptz
)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service public.services;
  v_appointment public.appointments;
begin
  select *
  into v_service
  from public.services
  where id = p_service_id
    and organization_id = p_organization_id
    and is_active = true;

  if v_service.id is null then
    raise exception 'Service not found or inactive.' using errcode = 'P0002';
  end if;

  insert into public.appointments (
    organization_id, service_id, customer_name, customer_email,
    customer_phone, device_info, issue_description,
    start_time, end_time, status
  )
  values (
    p_organization_id, p_service_id, p_customer_name, p_customer_email,
    p_customer_phone, p_device_info, p_issue_description,
    p_start_time, p_start_time + make_interval(mins => v_service.duration_minutes), 'pending'
  )
  returning * into v_appointment;

  return v_appointment;
end;
$$;

revoke all on function public.create_pending_appointment(
  uuid, uuid, text, text, text, text, text, timestamptz
) from public;
grant execute on function public.create_pending_appointment(
  uuid, uuid, text, text, text, text, text, timestamptz
) to anon;

-- ----------------------------------------------------------------------------
-- confirm_pending_appointment
-- Immediately confirms a still-pending appointment for free (price = 0)
-- services, which skip the payment step entirely. Scoped to `pending` rows
-- for idempotency, mirroring the payment-webhook confirmation helpers.
-- ----------------------------------------------------------------------------
create or replace function public.confirm_pending_appointment(
  p_organization_id uuid,
  p_appointment_id uuid
)
returns public.appointments
language sql
security definer
set search_path = public
as $$
  update public.appointments
  set status = 'confirmed'
  where id = p_appointment_id
    and organization_id = p_organization_id
    and status = 'pending'
  returning *;
$$;

revoke all on function public.confirm_pending_appointment(uuid, uuid) from public;
grant execute on function public.confirm_pending_appointment(uuid, uuid) to anon;

-- ----------------------------------------------------------------------------
-- get_appointment_details
-- Appointment + service name + organization name for the public booking
-- confirmation page. `p_organization_id` is a mandatory parameter (not
-- optional, unlike the old TypeScript helper) — every anonymous caller must
-- supply it.
-- ----------------------------------------------------------------------------
create or replace function public.get_appointment_details(
  p_appointment_id uuid,
  p_organization_id uuid
)
returns table (
  appointment public.appointments,
  service_name text,
  organization_name text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    a,
    coalesce(s.name, 'Service'),
    coalesce(o.name, 'Provider')
  from public.appointments a
  left join public.services s on s.id = a.service_id
  left join public.organizations o on o.id = a.organization_id
  where a.id = p_appointment_id
    and a.organization_id = p_organization_id;
$$;

revoke all on function public.get_appointment_details(uuid, uuid) from public;
grant execute on function public.get_appointment_details(uuid, uuid) to anon;
