-- Миграция 001: данни по потребител (Ниво 2, Фаза 4)
-- За база, създадена със старата схема (без акаунти). За нова база ползвай schema.sql.
-- Преди да я пуснеш, замени ТВОЯ-UID с User UID от Supabase → Authentication → Users.
-- Общите упражнения са тези с id от 1 до 26 (от seed.sql); останалите стават лични.

begin;

alter table exercises add column user_id uuid references auth.users (id) on delete cascade;
alter table workouts  add column user_id uuid references auth.users (id) on delete cascade;
alter table plans     add column user_id uuid references auth.users (id) on delete cascade;

-- Досегашните данни стават на този акаунт
update workouts  set user_id = 'ТВОЯ-UID';
update plans     set user_id = 'ТВОЯ-UID';
update exercises set user_id = 'ТВОЯ-UID' where id > 26;

alter table workouts alter column user_id set not null;
alter table plans    alter column user_id set not null;

drop index plans_name_unique;
create unique index plans_name_unique on plans (user_id, lower(name));

drop index exercises_name_unique;
create unique index exercises_shared_name_unique on exercises (lower(name)) where user_id is null;
create unique index exercises_user_name_unique on exercises (user_id, lower(name)) where user_id is not null;

create index workouts_user_id_idx  on workouts (user_id);
create index plans_user_id_idx     on plans (user_id);
create index exercises_user_id_idx on exercises (user_id);

commit;