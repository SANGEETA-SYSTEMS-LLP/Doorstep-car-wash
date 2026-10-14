create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select profile.role::text
  from public.profiles as profile
  where profile.id = (select auth.uid())
  limit 1;
$$;

revoke all on function public.current_profile_role() from public;
grant execute on function public.current_profile_role() to authenticated;

do $$
declare
  recursive_policy record;
begin
  for recursive_policy in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and cmd in ('SELECT', 'ALL')
      and (
        coalesce(qual, '') ilike '%profiles%'
        or coalesce(with_check, '') ilike '%profiles%'
      )
  loop
    execute format(
      'drop policy %I on public.profiles',
      recursive_policy.policyname
    );
  end loop;
end;
$$;

drop policy if exists profiles_select_own_or_supervisor
  on public.profiles;

create policy profiles_select_own_or_supervisor
  on public.profiles
  for select
  to authenticated
  using (
    (select auth.uid()) = id
    or (select public.current_profile_role()) = 'supervisor'
  );
