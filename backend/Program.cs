using Npgsql;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var connectionString = builder.Configuration.GetConnectionString("Supabase")
    ?? throw new InvalidOperationException(
        "Липсва connection string 'Supabase'. Задай го с dotnet user-secrets.");

builder.Services.AddSingleton(NpgsqlDataSource.Create(connectionString));

var app = builder.Build();

app.UseCors("Frontend");

app.MapGet("/api/exercises", async (NpgsqlDataSource dataSource) =>
{
    var exercises = new List<Exercise>();

    await using var command = dataSource.CreateCommand(
        "select id, name, muscle_group from exercises order by id");
    await using var reader = await command.ExecuteReaderAsync();

    while (await reader.ReadAsync())
    {
        exercises.Add(new Exercise(
            reader.GetInt32(0),
            reader.GetString(1),
            reader.GetString(2)));
    }

    return exercises;
});

app.Run();

record Exercise(int Id, string Name, string MuscleGroup);