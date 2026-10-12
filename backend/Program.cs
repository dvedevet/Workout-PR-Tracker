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

app.MapGet(
    "/api/exercises",
    async (NpgsqlDataSource dataSource) =>
    {
        var exercises = new List<Exercise>();

        await using var command = dataSource.CreateCommand(
            "select id, name, muscle_group from exercises order by id"
        );
        await using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            exercises.Add(
                new Exercise(reader.GetInt32(0), reader.GetString(1), reader.GetString(2))
            );
        }

        return exercises;
    }
);

app.MapGet(
    "/api/workouts",
    async (NpgsqlDataSource dataSource) =>
    {
        var workouts = new List<WorkoutDto>();

        await using var command = dataSource.CreateCommand(
            @"select w.id, w.workout_date, ws.exercise_id, e.name, e.muscle_group,
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
                    reader.GetString(4),
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

app.Run();

record Exercise(int Id, string Name, string MuscleGroup);

record WorkoutDto(int Id, DateOnly Date, List<WorkoutExerciseDto> Exercises);

record WorkoutExerciseDto(int ExerciseId, string Name, string MuscleGroup, List<SetDto> Sets);

record SetDto(decimal Weight, int Reps);

record NewWorkout(DateOnly Date, List<NewWorkoutExercise> Exercises);

record NewWorkoutExercise(int ExerciseId, List<NewSet> Sets);

record NewSet(decimal Weight, int Reps);
