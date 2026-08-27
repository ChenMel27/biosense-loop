create extension if not exists pgcrypto;

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 4 and 120),
  join_code text not null unique check (join_code = upper(join_code)),
  content_version_id text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'closed')),
  assignment_seed text not null,
  duration_minutes integer not null default 15 check (duration_minutes between 8 and 25),
  created_at timestamptz not null default now(),
  launched_at timestamptz,
  closed_at timestamptz
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  participant_tag text not null,
  code_hash text not null,
  assigned_condition text not null check (assigned_condition in ('adaptive', 'reflection')),
  eligible boolean not null default true,
  created_at timestamptz not null default now(),
  unique (session_id, participant_tag),
  unique (session_id, code_hash)
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete restrict,
  participant_tag text not null,
  condition text not null check (condition in ('adaptive', 'reflection')),
  stage text not null default 'initial' check (stage in ('initial', 'revision', 'transfer', 'survey', 'complete')),
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  draft_text text check (char_length(draft_text) <= 2000),
  draft_stage text check (draft_stage in ('initial', 'revision', 'transfer')),
  technical_status text not null default 'ok' check (technical_status in ('ok', 'fallback', 'incident')),
  unique (session_id, participant_id)
);

create table if not exists public.response_stages (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  stage text not null check (stage in ('initial', 'final', 'near_transfer')),
  prompt_id text not null,
  response_text text not null check (char_length(response_text) between 20 and 2000),
  confidence_choice text check (confidence_choice in ('not_sure', 'somewhat_sure', 'very_sure')),
  client_timestamp timestamptz,
  server_timestamp timestamptz not null default now(),
  content_version_id text not null,
  unique (attempt_id, stage)
);

create table if not exists public.ai_decisions (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  provider text not null check (provider in ('openai', 'deterministic', 'control')),
  model text not null,
  schema_version text not null,
  demonstrated_idea_ids jsonb not null default '[]'::jsonb,
  missing_idea_ids jsonb not null default '[]'::jsonb,
  possible_alternative_conception_ids jsonb not null default '[]'::jsonb,
  classification_confidence double precision not null check (classification_confidence between 0 and 1),
  recommended_prompt_id text not null,
  displayed_prompt_id text not null,
  abstain boolean not null,
  reason_codes jsonb not null default '[]'::jsonb,
  latency_ms integer not null check (latency_ms >= 0),
  fallback_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.surveys (
  attempt_id uuid primary key references public.attempts(id) on delete cascade,
  clarity integer not null check (clarity between 1 and 5),
  pressure integer not null check (pressure between 1 and 5),
  helpfulness integer not null check (helpfulness between 1 and 5),
  open_comment text not null default '' check (char_length(open_comment) <= 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  attempt_id uuid references public.attempts(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.teacher_actions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  action_type text not null check (action_type in ('proceed', 'whole_class_clarification', 'small_group', 'review_responses', 'other')),
  note text not null default '' check (char_length(note) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists participants_session_idx on public.participants(session_id);
create index if not exists attempts_session_idx on public.attempts(session_id);
create index if not exists responses_attempt_idx on public.response_stages(attempt_id);
create index if not exists decisions_attempt_idx on public.ai_decisions(attempt_id);
create index if not exists events_session_created_idx on public.events(session_id, created_at desc);

alter table public.sessions enable row level security;
alter table public.participants enable row level security;
alter table public.attempts enable row level security;
alter table public.response_stages enable row level security;
alter table public.ai_decisions enable row level security;
alter table public.surveys enable row level security;
alter table public.events enable row level security;
alter table public.teacher_actions enable row level security;

revoke all on public.sessions, public.participants, public.attempts, public.response_stages,
  public.ai_decisions, public.surveys, public.events, public.teacher_actions from anon, authenticated;

create or replace view public.research_export with (security_invoker = true) as
select
  a.session_id,
  a.participant_tag,
  a.condition,
  a.stage as completion_state,
  a.started_at,
  a.completed_at,
  max(r.response_text) filter (where r.stage = 'initial') as initial_text,
  max(r.confidence_choice) filter (where r.stage = 'initial') as initial_confidence,
  max(d.displayed_prompt_id) as displayed_prompt_id,
  max(d.provider) as ai_provider,
  max(d.model) as ai_model,
  max(d.classification_confidence) as ai_confidence,
  bool_or(d.abstain) as ai_abstained,
  max(d.fallback_reason) as fallback_reason,
  max(r.response_text) filter (where r.stage = 'final') as final_text,
  max(r.confidence_choice) filter (where r.stage = 'final') as final_confidence,
  max(r.response_text) filter (where r.stage = 'near_transfer') as near_transfer_text,
  max(r.confidence_choice) filter (where r.stage = 'near_transfer') as near_transfer_confidence,
  max(s.clarity) as clarity,
  max(s.pressure) as pressure,
  max(s.helpfulness) as helpfulness,
  max(s.open_comment) as open_comment
  , max(ta.action_type) as teacher_action_type
  , max(ta.note) as teacher_action_note
from public.attempts a
join public.participants p on p.id = a.participant_id and p.eligible = true
left join public.response_stages r on r.attempt_id = a.id
left join public.ai_decisions d on d.attempt_id = a.id
left join public.surveys s on s.attempt_id = a.id
left join lateral (
  select action_type, note
  from public.teacher_actions
  where teacher_actions.session_id = a.session_id
  order by created_at desc
  limit 1
) ta on true
group by a.id;

revoke all on public.research_export from anon, authenticated;
