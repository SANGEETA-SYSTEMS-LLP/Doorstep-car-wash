create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique default (
    'SUP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
  ),
  created_by uuid not null references auth.users(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  issue_type text not null check (
    issue_type in (
      'booking_issue',
      'washer_issue',
      'payment_issue',
      'refund_request',
      'service_quality',
      'additional_charge',
      'other'
    )
  ),
  subject text not null check (char_length(subject) between 3 and 160),
  description text not null check (char_length(description) between 10 and 5000),
  status text not null default 'open' check (
    status in ('open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed')
  ),
  priority text not null default 'normal' check (
    priority in ('low', 'normal', 'high', 'urgent')
  ),
  assigned_to uuid references auth.users(id) on delete set null,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists support_tickets_created_by_created_at_idx
  on public.support_tickets (created_by, created_at desc);

create index if not exists support_tickets_status_created_at_idx
  on public.support_tickets (status, created_at desc);

create index if not exists support_tickets_booking_id_idx
  on public.support_tickets (booking_id)
  where booking_id is not null;

create function public.set_support_ticket_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  if new.status = 'resolved' and old.status is distinct from 'resolved' then
    new.resolved_at = now();
  elsif new.status <> 'resolved' then
    new.resolved_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at
  before update on public.support_tickets
  for each row execute function public.set_support_ticket_updated_at();

alter table public.support_tickets enable row level security;

drop policy if exists "Users can create their own support tickets" on public.support_tickets;
create policy "Users can create their own support tickets"
  on public.support_tickets for insert to authenticated
  with check (created_by = (select auth.uid()));

drop policy if exists "Users can read their own support tickets" on public.support_tickets;
create policy "Users can read their own support tickets"
  on public.support_tickets for select to authenticated
  using (
    created_by = (select auth.uid())
    or (select public.current_profile_role()) in ('support', 'supervisor', 'sub_admin', 'super_admin')
  );

drop policy if exists "Support staff can update support tickets" on public.support_tickets;
create policy "Support staff can update support tickets"
  on public.support_tickets for update to authenticated
  using ((select public.current_profile_role()) in ('support', 'supervisor', 'sub_admin', 'super_admin'))
  with check ((select public.current_profile_role()) in ('support', 'supervisor', 'sub_admin', 'super_admin'));

grant select, insert, update on public.support_tickets to authenticated;
