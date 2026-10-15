-- Workout & PR Tracker: схема на базата (PostgreSQL / Supabase)
-- Изпълни в Supabase → SQL Editor върху празна база, после изпълни и seed.sql.

begin;

-- Каталог с упражнения. Първата група в muscle_groups е ГЛАВНАТА.
create table exercises (
    id int generated always as identity primary key,
    name text not null,
    muscle_groups text[] not null,
    constraint exercises_muscle_groups_check check (
        cardinality(muscle_groups) between 1 and 6
        and muscle_groups <@ array['Гърди', 'Гръб', 'Крака', 'Рамене', 'Бицепс', 'Трицепс']
    )
);

-- Две упражнения не могат да имат едно и също име, без значение от главни/малки букви
create unique index exercises_name_unique on exercises (lower(name));

-- Една тренировка = един ден (датата без час)
create table workouts (
    id int generated always as identity primary key,
    workout_date date not null
);

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

-- Графици: шаблон от упражнения. Не се пазят в тренировките, затова
-- изтриването или промяната на график не променя историята.
create table plans (
    id int generated always as identity primary key,
    name text not null check (char_length(name) between 1 and 60)
);

create unique index plans_name_unique on plans (lower(name));

-- Свързваща таблица график ↔ упражнение; position пази реда
create table plan_exercises (
    plan_id int not null references plans (id) on delete cascade,
    exercise_id int not null references exercises (id),
    position int not null check (position > 0),
    primary key (plan_id, exercise_id),
    unique (plan_id, position)
);

-- Сигурност: RLS е включен без политики. Достъпът е само през нашето API.
alter table exercises enable row level security;
alter table workouts enable row level security;
alter table workout_sets enable row level security;
alter table plans enable row level security;
alter table plan_exercises enable row level security;

commit;
