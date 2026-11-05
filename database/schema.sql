-- Workout & PR Tracker: схема на базата (PostgreSQL / Supabase)
-- Изпълни в Supabase → SQL Editor върху празна база, после изпълни и seed.sql.
-- Нужна е Supabase база, защото таблиците сочат към auth.users.
-- Ако базата вече съществува (от преди акаунтите), виж migrations/001_user_id.sql.

begin;

-- Каталог с упражнения. Първата група в muscle_groups е ГЛАВНАТА.
-- user_id е null за общите упражнения (за всички) и сочи към собственика за личните.
create table exercises (
    id int generated always as identity primary key,
    name text not null,
    muscle_groups text[] not null,
    user_id uuid references auth.users (id) on delete cascade,
    constraint exercises_muscle_groups_check check (
        cardinality(muscle_groups) between 1 and 6
        and muscle_groups <@ array['Гърди', 'Гръб', 'Крака', 'Рамене', 'Бицепс', 'Трицепс']
    )
);

-- Име, уникално без значение от главни/малки букви: отделно за общите и за личните
-- (API-то допълнително пази личните да не съвпадат с общите)
create unique index exercises_shared_name_unique on exercises (lower(name)) where user_id is null;
create unique index exercises_user_name_unique on exercises (user_id, lower(name)) where user_id is not null;
create index exercises_user_id_idx on exercises (user_id);

-- Една тренировка = един ден (датата без час), винаги с собственик
create table workouts (
    id int generated always as identity primary key,
    workout_date date not null,
    user_id uuid not null references auth.users (id) on delete cascade
);

create index workouts_user_id_idx on workouts (user_id);

-- Серии. При изтриване на тренировка сериите ѝ се трият автоматично (cascade).
-- Към упражнението НЯМА cascade: не може да се изтрие упражнение, което има серии.
create table workout_sets (
    id int generated always as identity primary key,
    workout_id int not null references workouts (id) on delete cascade,
    exercise_id int not null references exercises (id),
    set_number int not null check (set_number > 0),
    weight numeric(6, 2) not null check (weight >= 0),
    reps int not null check (reps > 0)
);

-- Графици: шаблон от упражнения, личен за всеки потребител. Не се пазят в
-- тренировките, затова изтриването или промяната на график не променя историята.
create table plans (
    id int generated always as identity primary key,
    name text not null check (char_length(name) between 1 and 60),
    user_id uuid not null references auth.users (id) on delete cascade
);

create unique index plans_name_unique on plans (user_id, lower(name));
create index plans_user_id_idx on plans (user_id);

-- Свързваща таблица график ↔ упражнение; position пази реда
create table plan_exercises (
    plan_id int not null references plans (id) on delete cascade,
    exercise_id int not null references exercises (id),
    position int not null check (position > 0),
    primary key (plan_id, exercise_id),
    unique (plan_id, position)
);

-- Сигурност: RLS е включен БЕЗ политики. Достъпът е само през нашето API,
-- което се свързва с права на собственик и филтрира по user_id в кода.
alter table exercises enable row level security;
alter table workouts enable row level security;
alter table workout_sets enable row level security;
alter table plans enable row level security;
alter table plan_exercises enable row level security;

commit;