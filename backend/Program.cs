using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "Frontend",
        policy => policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()
    );
});

var connectionString =
    builder.Configuration.GetConnectionString("Supabase")
    ?? throw new InvalidOperationException(
        "Липсва connection string 'Supabase'. Задай го с dotnet user-secrets."
    );

// DbContext се създава наново за всяка заявка (scoped)
builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

var app = builder.Build();

app.UseCors("Frontend");

// Трябва да съвпада със списъка в базата (check) и в React (data/muscleGroups.js)
var allowedGroups = new[] { "Гърди", "Гръб", "Крака", "Рамене", "Бицепс", "Трицепс" };

// Грешките на базата идват като DbUpdateException; кодът е във вътрешната PostgresException
static bool HasSqlState(Exception ex, string sqlState) =>
    ex.InnerException is PostgresException pg && pg.SqlState == sqlState;

string? ValidatePlan(PlanInput input, out string name, out int[] exerciseIds)
{
    name = Regex.Replace((input.Name ?? "").Trim(), @"\s+", " ");
    exerciseIds = (input.ExerciseIds ?? new List<int>()).Distinct().ToArray();

    if (name.Length == 0 || name.Length > 60)
        return "Името на графика трябва да е между 1 и 60 символа.";
    if (exerciseIds.Length == 0 || exerciseIds.Length > 50)
        return "Графикът трябва да има между 1 и 50 упражнения.";
    return null;
}

// ---------- Упражнения ----------

app.MapGet(
    "/api/exercises",
    async (AppDbContext db) =>
        await db
            .Exercises.OrderBy(e => e.Id)
            .Select(e => new ExerciseDto(e.Id, e.Name, e.MuscleGroups))
            .ToListAsync()
);

app.MapPost(
    "/api/exercises",
    async (NewExercise input, AppDbContext db) =>
    {
        var name = Regex.Replace((input.Name ?? "").Trim(), @"\s+", " ");
        if (name.Length == 0 || name.Length > 60)
            return Results.BadRequest("Името трябва да е между 1 и 60 символа.");

        var groups = (input.MuscleGroups ?? new List<string>()).Distinct().ToArray();
        if (groups.Length == 0 || groups.Any(group => !allowedGroups.Contains(group)))
            return Results.BadRequest("Избери поне една валидна мускулна група.");

        var exercise = new Exercise { Name = name, MuscleGroups = groups };
        db.Exercises.Add(exercise);

        try
        {
            await db.SaveChangesAsync();
            return Results.Created(
                $"/api/exercises/{exercise.Id}",
                new ExerciseDto(exercise.Id, exercise.Name, exercise.MuscleGroups)
            );
        }
        catch (DbUpdateException ex) when (HasSqlState(ex, PostgresErrorCodes.UniqueViolation))
        {
            return Results.Conflict("Упражнение с такова име вече съществува.");
        }
    }
);

// ---------- Тренировки ----------

app.MapGet(
    "/api/workouts",
    async (AppDbContext db) =>
    {
        // Една заявка: тренировки със сериите си и данните на упражнението
        var rows = await db
            .Workouts.Where(w => w.Sets.Any())
            .OrderByDescending(w => w.Date)
            .ThenByDescending(w => w.Id)
            .Select(w => new
            {
                w.Id,
                w.Date,
                Sets = w
                    .Sets.OrderBy(s => s.Id)
                    .Select(s => new
                    {
                        s.ExerciseId,
                        s.Exercise.Name,
                        s.Exercise.MuscleGroups,
                        s.Weight,
                        s.Reps,
                    })
                    .ToList(),
            })
            .ToListAsync();

        // Групирането по упражнение става в паметта (чист LINQ върху списък)
        return rows.Select(w => new WorkoutDto(
                w.Id,
                w.Date,
                w.Sets.GroupBy(s => s.ExerciseId)
                    .Select(g => new WorkoutExerciseDto(
                        g.Key,
                        g.First().Name,
                        g.First().MuscleGroups,
                        g.Select(s => new SetDto(s.Weight, s.Reps)).ToList()
                    ))
                    .ToList()
            ))
            .ToList();
    }
);

app.MapPost(
    "/api/workouts",
    async (NewWorkout workout, AppDbContext db) =>
    {
        if (workout.Date == default)
            return Results.BadRequest("Липсва дата на тренировката.");

        if (
            workout.Exercises is null
            || workout.Exercises.Count == 0
            || workout.Exercises.Any(exercise => exercise.Sets is null || exercise.Sets.Count == 0)
        )
            return Results.BadRequest("Тренировката трябва да има поне една серия.");

        if (
            workout.Exercises.Any(exercise =>
                exercise.Sets.Any(set => set.Weight < 0 || set.Weight > 9999.99m || set.Reps <= 0)
            )
        )
            return Results.BadRequest(
                "Тежестта трябва да е между 0 и 9999.99, а повторенията - над 0."
            );

        var entity = new Workout
        {
            Date = workout.Date,
            Sets = workout
                .Exercises.SelectMany(exercise =>
                    exercise.Sets.Select(
                        (set, index) =>
                            new WorkoutSet
                            {
                                ExerciseId = exercise.ExerciseId,
                                SetNumber = index + 1,
                                Weight = set.Weight,
                                Reps = set.Reps,
                            }
                    )
                )
                .ToList(),
        };
        db.Workouts.Add(entity);

        try
        {
            // Един SaveChanges = една транзакция: или всичко, или нищо
            await db.SaveChangesAsync();
            return Results.Created($"/api/workouts/{entity.Id}", new { id = entity.Id });
        }
        catch (DbUpdateException ex) when (HasSqlState(ex, PostgresErrorCodes.ForeignKeyViolation))
        {
            return Results.BadRequest("Има упражнение, което не съществува.");
        }
    }
);

app.MapDelete(
    "/api/workouts/{id:int}",
    async (int id, AppDbContext db) =>
    {
        // Сериите се трият от базата (on delete cascade)
        var rows = await db.Workouts.Where(w => w.Id == id).ExecuteDeleteAsync();
        return rows == 0 ? Results.NotFound() : Results.NoContent();
    }
);

// ---------- Графици ----------

app.MapGet(
    "/api/plans",
    async (AppDbContext db) =>
        await db
            .Plans.OrderBy(p => p.Id)
            .Select(p => new PlanDto(
                p.Id,
                p.Name,
                p.Exercises.OrderBy(pe => pe.Position).Select(pe => pe.ExerciseId).ToList()
            ))
            .ToListAsync()
);

app.MapPost(
    "/api/plans",
    async (PlanInput input, AppDbContext db) =>
    {
        var error = ValidatePlan(input, out var name, out var exerciseIds);
        if (error is not null)
            return Results.BadRequest(error);

        var plan = new Plan
        {
            Name = name,
            Exercises = exerciseIds
                .Select(
                    (exerciseId, index) =>
                        new PlanExercise { ExerciseId = exerciseId, Position = index + 1 }
                )
                .ToList(),
        };
        db.Plans.Add(plan);

        try
        {
            await db.SaveChangesAsync();
            return Results.Created(
                $"/api/plans/{plan.Id}",
                new PlanDto(plan.Id, plan.Name, exerciseIds.ToList())
            );
        }
        catch (DbUpdateException ex) when (HasSqlState(ex, PostgresErrorCodes.UniqueViolation))
        {
            return Results.Conflict("График с такова име вече съществува.");
        }
        catch (DbUpdateException ex) when (HasSqlState(ex, PostgresErrorCodes.ForeignKeyViolation))
        {
            return Results.BadRequest("Има упражнение, което не съществува.");
        }
    }
);

app.MapPut(
    "/api/plans/{id:int}",
    async (int id, PlanInput input, AppDbContext db) =>
    {
        var error = ValidatePlan(input, out var name, out var exerciseIds);
        if (error is not null)
            return Results.BadRequest(error);

        // ExecuteDelete тръгва веднага, затова обгръщаме всичко в ръчна транзакция
        await using var transaction = await db.Database.BeginTransactionAsync();

        try
        {
            var plan = await db.Plans.FindAsync(id);
            if (plan is null)
                return Results.NotFound();

            plan.Name = name;

            await db.PlanExercises.Where(pe => pe.PlanId == id).ExecuteDeleteAsync();

            for (var i = 0; i < exerciseIds.Length; i++)
            {
                db.PlanExercises.Add(
                    new PlanExercise
                    {
                        PlanId = id,
                        ExerciseId = exerciseIds[i],
                        Position = i + 1,
                    }
                );
            }

            await db.SaveChangesAsync();
            await transaction.CommitAsync();
            return Results.Ok(new PlanDto(id, name, exerciseIds.ToList()));
        }
        catch (DbUpdateException ex) when (HasSqlState(ex, PostgresErrorCodes.UniqueViolation))
        {
            return Results.Conflict("График с такова име вече съществува.");
        }
        catch (DbUpdateException ex) when (HasSqlState(ex, PostgresErrorCodes.ForeignKeyViolation))
        {
            return Results.BadRequest("Има упражнение, което не съществува.");
        }
    }
);

app.MapDelete(
    "/api/plans/{id:int}",
    async (int id, AppDbContext db) =>
    {
        var rows = await db.Plans.Where(p => p.Id == id).ExecuteDeleteAsync();
        return rows == 0 ? Results.NotFound() : Results.NoContent();
    }
);

app.Run();
