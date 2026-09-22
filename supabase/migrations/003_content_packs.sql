create table if not exists public.content_packs (
  version_id text primary key,
  pack_id text not null,
  title text not null check (char_length(title) between 2 and 160),
  content jsonb not null,
  approved_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (content->>'versionId' = version_id),
  check (content->>'teacherReviewStatus' = 'approved')
);

create index if not exists content_packs_approved_idx
  on public.content_packs(approved_at desc);

alter table public.content_packs enable row level security;
revoke all on public.content_packs from anon, authenticated;

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
  max(s.open_comment) as open_comment,
  max(ta.action_type) as teacher_action_type,
  max(ta.note) as teacher_action_note,
  max(a.technical_status) as technical_status,
  max(d.demonstrated_idea_ids::text) as demonstrated_idea_ids,
  max(d.missing_idea_ids::text) as missing_idea_ids,
  max(d.possible_alternative_conception_ids::text) as possible_alternative_conception_ids,
  max(d.reason_codes::text) as ai_reason_codes,
  max(d.schema_version) as ai_schema_version,
  max(d.latency_ms) as ai_latency_ms
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
