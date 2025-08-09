-- Enums
create type if not exists public.app_role as enum ('admin','teacher','learner');
create type if not exists public.task_type as enum (
  'mcq','match','scramble','sentence_order','syllable_split','dictation','listening','picture_bingo','sound_to_letter','letter_to_sound'
);

-- Core tables
create table if not exists public.classrooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text,
  l1 text,
  role public.app_role not null default 'learner',
  classroom_id uuid references public.classrooms(id) on delete set null,
  difficulty_level int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint difficulty_range check (difficulty_level between 1 and 3)
);

create table if not exists public.admin_invite_links (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  invite_code text not null unique,
  for_role public.app_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Daily content
create table if not exists public.daily_words (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  norwegian text not null,
  theme text,
  date date not null,
  image_url text,
  image_alt text,
  approved boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (classroom_id, date)
);

create table if not exists public.translations (
  id uuid primary key default gen_random_uuid(),
  dailyword_id uuid not null references public.daily_words(id) on delete cascade,
  language_code text not null,
  text text not null
);

create table if not exists public.pronunciations (
  id uuid primary key default gen_random_uuid(),
  dailyword_id uuid not null references public.daily_words(id) on delete cascade,
  language_code text not null,
  audio_url text not null
);

create table if not exists public.level_texts (
  id uuid primary key default gen_random_uuid(),
  dailyword_id uuid not null references public.daily_words(id) on delete cascade,
  level int not null check (level between 1 and 3),
  text text not null,
  image_url text,
  image_alt text
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  dailyword_id uuid not null references public.daily_words(id) on delete cascade,
  level int not null check (level between 1 and 3),
  type public.task_type not null,
  prompt text,
  data jsonb,
  answer jsonb
);

create table if not exists public.task_results (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  learner_id uuid not null references auth.users(id) on delete cascade,
  response jsonb,
  score double precision,
  created_at timestamptz not null default now()
);

create table if not exists public.weekly_tests (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  iso_week int not null,
  date date not null,
  tasks jsonb not null,
  auto_grade boolean not null default true,
  unique (classroom_id, iso_week)
);

create table if not exists public.learner_recordings (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references auth.users(id) on delete cascade,
  dailyword_id uuid not null references public.daily_words(id) on delete cascade,
  audio_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  title text not null,
  url text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.classrooms enable row level security;
alter table public.profiles enable row level security;
alter table public.admin_invite_links enable row level security;
alter table public.daily_words enable row level security;
alter table public.translations enable row level security;
alter table public.pronunciations enable row level security;
alter table public.level_texts enable row level security;
alter table public.tasks enable row level security;
alter table public.task_results enable row level security;
alter table public.weekly_tests enable row level security;
alter table public.learner_recordings enable row level security;
alter table public.videos enable row level security;

-- Triggers
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create or replace trigger trg_profiles_updated before update on public.profiles for each row execute function public.touch_updated_at();

-- Policies
-- Profiles
create policy if not exists "profiles self read" on public.profiles for select to authenticated using (id = auth.uid());
create policy if not exists "profiles self write" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy if not exists "teacher sees class learners" on public.profiles for select to authenticated using (
  exists (select 1 from public.profiles tp where tp.id=auth.uid() and tp.role='teacher' and tp.classroom_id=profiles.classroom_id)
);
create policy if not exists "admin sees all profiles" on public.profiles for select to authenticated using (
  exists (select 1 from public.profiles ap where ap.id=auth.uid() and ap.role='admin')
);

-- Classrooms
create policy if not exists "class members read classroom" on public.classrooms for select to authenticated using (
  exists (select 1 from public.profiles p where p.id=auth.uid() and p.classroom_id=classrooms.id)
);
create policy if not exists "admin manage classrooms" on public.classrooms for all to authenticated using (
  exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')
) with check (true);

-- Invite links
create policy if not exists "active invites readable" on public.admin_invite_links for select using (active=true);
create policy if not exists "admin manage invites" on public.admin_invite_links for all to authenticated using (
  exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')
) with check (true);

-- Daily words
create policy if not exists "class read daily_words" on public.daily_words for select to authenticated using (
  exists (select 1 from public.profiles p where p.id=auth.uid() and p.classroom_id=daily_words.classroom_id)
);
create policy if not exists "teacher write daily_words" on public.daily_words for all to authenticated using (
  exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('teacher','admin') and p.classroom_id=daily_words.classroom_id)
) with check (
  exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('teacher','admin') and p.classroom_id=daily_words.classroom_id)
);

-- Translations
create policy if not exists "class read translations" on public.translations for select to authenticated using (
  exists (select 1 from public.daily_words dw join public.profiles p on p.classroom_id=dw.classroom_id where dw.id=translations.dailyword_id and p.id=auth.uid())
);
create policy if not exists "teacher write translations" on public.translations for all to authenticated using (
  exists (select 1 from public.daily_words dw join public.profiles p on p.classroom_id=dw.classroom_id where dw.id=translations.dailyword_id and p.id=auth.uid() and p.role in ('teacher','admin'))
) with check (true);

-- Pronunciations
create policy if not exists "class read pronunciations" on public.pronunciations for select to authenticated using (
  exists (select 1 from public.daily_words dw join public.profiles p on p.classroom_id=dw.classroom_id where dw.id=pronunciations.dailyword_id and p.id=auth.uid())
);
create policy if not exists "teacher write pronunciations" on public.pronunciations for all to authenticated using (
  exists (select 1 from public.daily_words dw join public.profiles p on p.classroom_id=dw.classroom_id where dw.id=pronunciations.dailyword_id and p.id=auth.uid() and p.role in ('teacher','admin'))
) with check (true);

-- Level texts
create policy if not exists "class read level_texts" on public.level_texts for select to authenticated using (
  exists (select 1 from public.daily_words dw join public.profiles p on p.classroom_id=dw.classroom_id where dw.id=level_texts.dailyword_id and p.id=auth.uid())
);
create policy if not exists "teacher write level_texts" on public.level_texts for all to authenticated using (
  exists (select 1 from public.daily_words dw join public.profiles p on p.classroom_id=dw.classroom_id where dw.id=level_texts.dailyword_id and p.id=auth.uid() and p.role in ('teacher','admin'))
) with check (true);

-- Tasks
create policy if not exists "class read tasks" on public.tasks for select to authenticated using (
  exists (select 1 from public.daily_words dw join public.profiles p on p.classroom_id=dw.classroom_id where dw.id=tasks.dailyword_id and p.id=auth.uid())
);
create policy if not exists "teacher write tasks" on public.tasks for all to authenticated using (
  exists (select 1 from public.daily_words dw join public.profiles p on p.classroom_id=dw.classroom_id where dw.id=tasks.dailyword_id and p.id=auth.uid() and p.role in ('teacher','admin'))
) with check (true);

-- Task results
create policy if not exists "learner read own results" on public.task_results for select to authenticated using (learner_id = auth.uid());
create policy if not exists "learner write own results" on public.task_results for insert to authenticated with check (learner_id = auth.uid());
create policy if not exists "teacher read class results" on public.task_results for select to authenticated using (
  exists (
    select 1
    from public.tasks t
    join public.daily_words dw on dw.id=t.dailyword_id
    join public.profiles tp on tp.id=auth.uid() and tp.role in ('teacher','admin') and tp.classroom_id=dw.classroom_id
    where t.id=task_results.task_id
  )
);

-- Weekly tests
create policy if not exists "class read tests" on public.weekly_tests for select to authenticated using (
  exists (select 1 from public.profiles p where p.id=auth.uid() and p.classroom_id=weekly_tests.classroom_id)
);
create policy if not exists "teacher write tests" on public.weekly_tests for all to authenticated using (
  exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('teacher','admin') and p.classroom_id=weekly_tests.classroom_id)
) with check (true);

-- Recordings
create policy if not exists "learner read own rec" on public.learner_recordings for select to authenticated using (learner_id = auth.uid());
create policy if not exists "learner write own rec" on public.learner_recordings for insert to authenticated with check (learner_id = auth.uid());
create policy if not exists "teacher read class rec" on public.learner_recordings for select to authenticated using (
  exists (
    select 1 from public.daily_words dw
    join public.profiles tp on tp.id=auth.uid() and tp.role in ('teacher','admin') and tp.classroom_id=dw.classroom_id
    where dw.id=learner_recordings.dailyword_id
  )
);

-- Videos
create policy if not exists "class read videos" on public.videos for select to authenticated using (
  exists (select 1 from public.profiles p where p.id=auth.uid() and p.classroom_id=videos.classroom_id)
);
create policy if not exists "teacher write videos" on public.videos for all to authenticated using (
  exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('teacher','admin') and p.classroom_id=videos.classroom_id)
) with check (true);

-- RPC: register_with_invite
create or replace function public.register_with_invite(invite_code text, name text, l1_code text default null, want_role public.app_role default 'learner')
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  _class uuid;
  _role public.app_role;
begin
  select classroom_id, for_role into _class, _role
  from public.admin_invite_links
  where invite_code = register_with_invite.invite_code and active = true;

  if _class is null then
    raise exception 'Invalid or inactive invite code';
  end if;

  if want_role <> _role then
    raise exception 'Invite link role mismatch';
  end if;

  insert into public.profiles (id, name, l1, role, classroom_id)
  values (auth.uid(), name, l1_code, _role, _class)
  on conflict (id) do update set name=excluded.name, l1=excluded.l1, role=_role, classroom_id=_class;
end;
$$;

-- Storage buckets
insert into storage.buckets (id, name, public) values ('audio','audio', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('images','images', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('generated','generated', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('videos','videos', true) on conflict (id) do nothing;

-- Storage policies (public read)
create policy if not exists "Public read audio" on storage.objects for select using (bucket_id = 'audio');
create policy if not exists "Public read images" on storage.objects for select using (bucket_id = 'images');
create policy if not exists "Public read generated" on storage.objects for select using (bucket_id = 'generated');
create policy if not exists "Public read videos" on storage.objects for select using (bucket_id = 'videos');

-- Authenticated writes
create policy if not exists "Users upload own audio" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'audio' and (storage.foldername(name))[1] = 'user' and (storage.foldername(name))[2] = auth.uid()::text
);
create policy if not exists "Users update own audio" on storage.objects
for update to authenticated using (
  bucket_id = 'audio' and (storage.foldername(name))[1] = 'user' and (storage.foldername(name))[2] = auth.uid()::text
) with check (
  bucket_id = 'audio' and (storage.foldername(name))[1] = 'user' and (storage.foldername(name))[2] = auth.uid()::text
);

create policy if not exists "Teachers manage generated" on storage.objects
for all to authenticated using (
  bucket_id = 'generated' and exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('teacher','admin'))
) with check (
  bucket_id = 'generated' and exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('teacher','admin'))
);

create policy if not exists "Teachers manage images" on storage.objects
for all to authenticated using (
  bucket_id = 'images' and exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('teacher','admin'))
) with check (
  bucket_id = 'images' and exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('teacher','admin'))
);

create policy if not exists "Teachers manage videos" on storage.objects
for all to authenticated using (
  bucket_id = 'videos' and exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('teacher','admin'))
) with check (
  bucket_id = 'videos' and exists (select 1 from public.profiles p where p.id=auth.uid() and p.role in ('teacher','admin'))
);
