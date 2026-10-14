using System.Text.RegularExpressions;
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

builder.Services.AddSingleton(NpgsqlDataSource.Create(connectionString));

var app = builder.Build();

app.UseCors("Frontend");

// Трябва да съвпада със списъка в базата (check) и в React (data/muscleGroups.js)
var allowedGroups = new[] { "Гърди", "Гръб", "Крака", "Рамене", "Бицепс", "Трицепс" };

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

async Task InsertPlanExercises(
    NpgsqlConnection connection,
    NpgsqlTransaction transaction,
    int planId,
    int[] exerciseIds
)
{
    for (var i = 0; i < exerciseIds.Length; i++)
    {
        await using var command = new NpgsqlCommand(
            @"insert into plan_exercises (plan_id, exercise_id, position)
              values (@planId, @exerciseId, @position)",
            connection,
            transaction
        );
        command.Parameters.AddWithValue("planId", planId);
        command.Parameters.AddWithValue("exerciseId", exerciseIds[i]);
        command.Parameters.AddWithValue("position", i + 1);
        await command.ExecuteNonQueryAsync();
    }
}

app.MapGet(
    "/api/exercises",
    async (NpgsqlDataSource dataSource) =>
    {
        var exercises = new List<Exercise>();

        await using var command = dataSource.CreateCommand(
            "select id, name, muscle_groups from exercises order by id"
        );
        await using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            exercises.Add(
                new Exercise(
                    reader.GetInt32(0),
                    reader.GetString(1),
                    reader.GetFieldValue<string[]>(2)
                )
            );
        }

        return exercises;
    }
);

app.MapPost(
    "/api/exercises",
    async (NewExercise input, NpgsqlDataSource dataSource) =>
    {
        var name = Regex.Replace((input.Name ?? "").Trim(), @"\s+", " ");
        if (name.Length == 0 || name.Length > 60)
            return Results.BadRequest("Името трябва да е между 1 и 60 символа.");

        var groups = (input.MuscleGroups ?? new List<string>()).Distinct().ToArray();
        if (groups.Length == 0 || groups.Any(group => !allowedGroups.Contains(group)))
            return Results.BadRequest("Избери поне една валидна мускулна група.");

        try
        {
            await using var command = dataSource.CreateCommand(
                "insert into exercises (name, muscle_groups) values (@name, @groups) returning id"
            );
            command.Parameters.AddWithValue("name", name);
            command.Parameters.AddWithValue("groups", groups);
            var id = (int)(await command.ExecuteScalarAsync())!;

            return Results.Created($"/api/exercises/{id}", new Exercise(id, name, groups));
        }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            return Results.Conflict("Упражнение с такова име вече съществува.");
        }
    }
);

app.MapGet(
    "/api/workouts",
    async (NpgsqlDataSource dataSource) =>
    {
        var workouts = new List<WorkoutDto>();

        await using var command = dataSource.CreateCommand(
            @"select w.id, w.workout_date, ws.exercise_id, e.name, e.muscle_groups,
                 ws.weight, ws.reps
          from workouts w
          join workout_sets ws on ws.workout_id = w.id
          join exercises e on e.id = ws.exercise_id
          order by w.workout_date desc, w.id desc, ws.id"
        );
        await using var reader = await command.ExecuteReaderAsync();

        WorkoutDto? currentWorkout = null;
        WorkoutExerciseDto? currentExercise = null;

        while (await reader.ReadAsync())
        {
            var workoutId = reader.GetInt32(0);
            var exerciseId = reader.GetInt32(2);

            if (currentWorkout is null || currentWorkout.Id != workoutId)
            {
                currentWorkout = new WorkoutDto(
                    workoutId,
                    reader.GetFieldValue<DateOnly>(1),
                    new List<WorkoutExerciseDto>()
                );
                workouts.Add(currentWorkout);
                currentExercise = null;
            }

            if (currentExercise is null || currentExercise.ExerciseId != exerciseId)
            {
                currentExercise = new WorkoutExerciseDto(
                    exerciseId,
                    reader.GetString(3),
                    reader.GetFieldValue<string[]>(4),
                    new List<SetDto>()
                );
                currentWorkout.Exercises.Add(currentExercise);
            }

            currentExercise.Sets.Add(new SetDto(reader.GetDecimal(5), reader.GetInt32(6)));
        }

        return workouts;
    }
);

app.MapPost(
    "/api/workouts",
    async (NewWorkout workout, NpgsqlDataSource dataSource) =>
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

        await using var connection = await dataSource.OpenConnectionAsync();
        await using var transaction = await connection.BeginTransactionAsync();

        try
        {
            await using var workoutCommand = new NpgsqlCommand(
                "insert into workouts (workout_date) values (@date) returning id",
                connection,
                transaction
            );
            workoutCommand.Parameters.AddWithValue("date", workout.Date);
            var workoutId = (int)(await workoutCommand.ExecuteScalarAsync())!;

            foreach (var exercise in workout.Exercises)
            {
                var setNumber = 1;
                foreach (var set in exercise.Sets)
                {
                    await using var setCommand = new NpgsqlCommand(
                        @"insert into workout_sets
                          (workout_id, exercise_id, set_number, weight, reps)
                      values (@workoutId, @exerciseId, @setNumber, @weight, @reps)",
                        connection,
                        transaction
                    );
                    setCommand.Parameters.AddWithValue("workoutId", workoutId);
                    setCommand.Parameters.AddWithValue("exerciseId", exercise.ExerciseId);
                    setCommand.Parameters.AddWithValue("setNumber", setNumber);
                    setCommand.Parameters.AddWithValue("weight", set.Weight);
                    setCommand.Parameters.AddWithValue("reps", set.Reps);
                    await setCommand.ExecuteNonQueryAsync();
                    setNumber++;
                }
            }

            await transaction.CommitAsync();
            return Results.Created($"/api/workouts/{workoutId}", new { id = workoutId });
        }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.ForeignKeyViolation)
        {
            return Results.BadRequest("Има упражнение, което не съществува.");
        }
    }
);

app.MapGet(
    "/api/plans",
    async (NpgsqlDataSource dataSource) =>
    {
        var plans = new List<PlanDto>();

        await using var command = dataSource.CreateCommand(
            @"select p.id, p.name, pe.exercise_id
          from plans p
          left join plan_exercises pe on pe.plan_id = p.id
          order by p.id, pe.position"
        );
        await using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            var planId = reader.GetInt32(0);
            var plan = plans.LastOrDefault();

            if (plan is null || plan.Id != planId)
            {
                plan = new PlanDto(planId, reader.GetString(1), new List<int>());
                plans.Add(plan);
            }

            if (!reader.IsDBNull(2))
                plan.ExerciseIds.Add(reader.GetInt32(2));
        }

        return plans;
    }
);

app.MapPost(
    "/api/plans",
    async (PlanInput input, NpgsqlDataSource dataSource) =>
    {
        var error = ValidatePlan(input, out var name, out var exerciseIds);
        if (error is not null)
            return Results.BadRequest(error);

        await using var connection = await dataSource.OpenConnectionAsync();
        await using var transaction = await connection.BeginTransactionAsync();

        try
        {
            await using var planCommand = new NpgsqlCommand(
                "insert into plans (name) values (@name) returning id",
                connection,
                transaction
            );
            planCommand.Parameters.AddWithValue("name", name);
            var planId = (int)(await planCommand.ExecuteScalarAsync())!;

            await InsertPlanExercises(connection, transaction, planId, exerciseIds);

            await transaction.CommitAsync();
            return Results.Created(
                $"/api/plans/{planId}",
                new PlanDto(planId, name, exerciseIds.ToList())
            );
        }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            return Results.Conflict("График с такова име вече съществува.");
        }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.ForeignKeyViolation)
        {
            return Results.BadRequest("Има упражнение, което не съществува.");
        }
    }
);

app.MapPut(
    "/api/plans/{id:int}",
    async (int id, PlanInput input, NpgsqlDataSource dataSource) =>
    {
        var error = ValidatePlan(input, out var name, out var exerciseIds);
        if (error is not null)
            return Results.BadRequest(error);

        await using var connection = await dataSource.OpenConnectionAsync();
        await using var transaction = await connection.BeginTransactionAsync();

        try
        {
            await using var updateCommand = new NpgsqlCommand(
                "update plans set name = @name where id = @id",
                connection,
                transaction
            );
            updateCommand.Parameters.AddWithValue("name", name);
            updateCommand.Parameters.AddWithValue("id", id);
            if (await updateCommand.ExecuteNonQueryAsync() == 0)
                return Results.NotFound();

            await using var deleteCommand = new NpgsqlCommand(
                "delete from plan_exercises where plan_id = @id",
                connection,
                transaction
            );
            deleteCommand.Parameters.AddWithValue("id", id);
            await deleteCommand.ExecuteNonQueryAsync();

            await InsertPlanExercises(connection, transaction, id, exerciseIds);

            await transaction.CommitAsync();
            return Results.Ok(new PlanDto(id, name, exerciseIds.ToList()));
        }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            return Results.Conflict("График с такова име вече съществува.");
        }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.ForeignKeyViolation)
        {
            return Results.BadRequest("Има упражнение, което не съществува.");
        }
    }
);

app.MapDelete(
    "/api/plans/{id:int}",
    async (int id, NpgsqlDataSource dataSource) =>
    {
        await using var command = dataSource.CreateCommand("delete from plans where id = @id");
        command.Parameters.AddWithValue("id", id);
        var rows = await command.ExecuteNonQueryAsync();

        return rows == 0 ? Results.NotFound() : Results.NoContent();
    }
);

app.Run();

record Exercise(int Id, string Name, string[] MuscleGroups);

record NewExercise(string Name, List<string> MuscleGroups);

record WorkoutDto(int Id, DateOnly Date, List<WorkoutExerciseDto> Exercises);

record WorkoutExerciseDto(int ExerciseId, string Name, string[] MuscleGroups, List<SetDto> Sets);

record SetDto(decimal Weight, int Reps);

record NewWorkout(DateOnly Date, List<NewWorkoutExercise> Exercises);

record NewWorkoutExercise(int ExerciseId, List<NewSet> Sets);

record NewSet(decimal Weight, int Reps);

record PlanDto(int Id, string Name, List<int> ExerciseIds);

record PlanInput(string Name, List<int> ExerciseIds);
