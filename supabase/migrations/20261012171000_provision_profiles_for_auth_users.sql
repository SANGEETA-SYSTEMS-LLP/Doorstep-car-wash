create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    phone,
    role
  )
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1)
    ),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'phone', ''),
      ''
    ),
    case
      when new.raw_app_meta_data ->> 'role' in (
        'customer',
        'washer',
        'supervisor',
        'support',
        'accountant',
        'sub_admin',
        'super_admin'
      )
        then new.raw_app_meta_data ->> 'role'
      else 'customer'
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;

drop trigger if exists create_profile_for_new_auth_user
  on auth.users;

create trigger create_profile_for_new_auth_user
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();

insert into public.profiles (
  id,
  full_name,
  phone,
  role
)
select
  auth_user.id,
  coalesce(
    nullif(auth_user.raw_user_meta_data ->> 'full_name', ''),
    split_part(auth_user.email, '@', 1)
  ),
  coalesce(
    nullif(auth_user.raw_user_meta_data ->> 'phone', ''),
    ''
  ),
  case
    when auth_user.raw_app_meta_data ->> 'role' in (
      'customer',
      'washer',
      'supervisor',
      'support',
      'accountant',
      'sub_admin',
      'super_admin'
    )
      then auth_user.raw_app_meta_data ->> 'role'
    else 'customer'
  end
from auth.users as auth_user
on conflict (id) do nothing;
