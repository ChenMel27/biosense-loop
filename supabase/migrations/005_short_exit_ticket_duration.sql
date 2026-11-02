-- New single-response activities are designed for the last 4–6 minutes of class.
-- Existing sessions keep their stored duration; this only updates validation for
-- newly created or edited rows. NOT VALID avoids rejecting legacy rows while the
-- constraint is still enforced for future inserts and updates.
alter table public.sessions
  drop constraint if exists sessions_duration_minutes_check;

alter table public.sessions
  add constraint sessions_duration_minutes_check
  check (duration_minutes between 4 and 15)
  not valid;

alter table public.sessions
  alter column duration_minutes set default 6;

-- Validate immediately when every legacy row already satisfies the new range.
-- Projects with older out-of-range sessions keep the constraint unvalidated so
-- those historical rows remain readable while new writes still use 4–15.
do $$
begin
  if not exists (
    select 1
    from public.sessions
    where duration_minutes not between 4 and 15
  ) then
    alter table public.sessions
      validate constraint sessions_duration_minutes_check;
  end if;
end
$$;
