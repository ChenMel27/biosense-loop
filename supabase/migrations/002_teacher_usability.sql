create table if not exists public.teacher_usability_events (
  id uuid primary key,
  run_id uuid not null,
  participant_tag text not null check (char_length(participant_tag) between 2 and 24),
  task_id text not null check (char_length(task_id) between 2 and 80),
  event_type text not null check (char_length(event_type) between 2 and 80),
  duration_ms integer check (duration_ms between 0 and 7200000),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.teacher_usability_submissions (
  id uuid primary key,
  run_id uuid not null unique,
  participant_tag text not null check (char_length(participant_tag) between 2 and 24),
  content_version_id text not null,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  authoring_draft jsonb not null,
  reviews jsonb not null,
  class_summary jsonb not null,
  sus_responses jsonb not null,
  sus_score double precision not null check (sus_score between 0 and 100),
  summary_usefulness integer not null check (summary_usefulness between 1 and 5),
  prompt_control integer not null check (prompt_control between 1 and 5),
  open_feedback text not null default '' check (char_length(open_feedback) <= 4000),
  task_metrics jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists teacher_usability_events_run_idx
  on public.teacher_usability_events(run_id, created_at);
create index if not exists teacher_usability_submissions_completed_idx
  on public.teacher_usability_submissions(completed_at desc);

alter table public.teacher_usability_events enable row level security;
alter table public.teacher_usability_submissions enable row level security;

revoke all on public.teacher_usability_events, public.teacher_usability_submissions
  from anon, authenticated;
