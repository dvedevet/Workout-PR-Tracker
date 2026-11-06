using System.Security.Claims;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var connectionString =
    builder.Configuration.GetConnectionString("Supabase")
    ?? throw new InvalidOperationException(
        "Липсва connection string 'Supabase'. Задай го с dotnet user-secrets."
    );

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));

var supabaseUrl =
    builder.Configuration["Supabase:Url"]
    ?? throw new InvalidOperationException("Липсва Supabase:Url в appsettings.json");
var issuer = $"{supabaseUrl}/auth/v1";
var keys = new SupabaseKeys($"{issuer}/.well-known/jwks.json");

builder
    .Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateAudience = true,
            ValidAudience = "authenticated",
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKeyResolver = (token, securityToken, kid, parameters) => keys.Get(kid),
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

app.UseCors("Frontend");

app.UseAuthentication();
app.UseAuthorization();

var api = app.MapGroup("/api").RequireAuthorization();

api.MapGet(
    "/me",
    (ClaimsPrincipal user) =>
        new { id = user.FindFirstValue("sub"), email = user.FindFirstValue("email") }
);

var allowedGroups = new[] { "Гърди", "Гръб", "Крака", "Рамене", "Бицепс", "Трицепс" };

static bool HasSqlState(Exception ex, string sqlState) =>
    ex.InnerException is PostgresException pg && pg.SqlState == sqlState;

static Guid GetUserId(ClaimsPrincipal user) => Guid.Parse(user.FindFirstValue("sub")!);

static async Task<bool> AllExercisesVisible(AppDbContext db, Guid userId, int[] exerciseIds) =>
    await db.Exercises.CountAsync(e =>
        exerciseIds.Contains(e.Id) && (e.UserId == null || e.UserId == userId)
    ) == exerciseIds.Length;


static bool IsValidPhoto(string photo)
{
    string[] prefixes =
    [
        "data:image/jpeg;base64,",
        "data:image/png;base64,",
        "data:image/webp;base64,",
    ];
    var prefix = prefixes.FirstOrDefault(p => photo.StartsWith(p, StringComparison.Ordinal));
    if (prefix is null || photo.Length > 300_000)
        return false;

    try
    {
        Convert.FromBase64String(photo[prefix.Length..]);
        return true;
    }
    catch (FormatException)
    {
        return false;
    }
}

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

api.MapGet(
    "/profile",
    async (ClaimsPrincipal user, AppDbContext db) =>
    {
        var userId = GetUserId(user);
        var profile = await db.Profiles.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == userId);

        return profile is null
            ? new ProfileDto(null, null, null)
            : new ProfileDto(profile.WeightKg, profile.HeightCm, profile.Photo);
    }
);

api.MapPut(
    "/profile",
    async (ProfileInput input, ClaimsPrincipal user, AppDbContext db) =>
    {
        if (input.WeightKg < 20m || input.WeightKg > 500m)
            return Results.BadRequest("Теглото трябва да е между 20 и 500 кг.");
        if (input.HeightCm < 80 || input.HeightCm > 260)
            return Results.BadRequest("Височината трябва да е между 80 и 260 см.");

        var userId = GetUserId(user);
        var profile = await db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile is null)
        {
            profile = new UserProfile { UserId = userId };
            db.Profiles.Add(profile);
        }

        profile.WeightKg = input.WeightKg is null ? null : Math.Round(input.WeightKg.Value, 2);
        profile.HeightCm = input.HeightCm;
        await db.SaveChangesAsync();

        return Results.Ok(new ProfileDto(profile.WeightKg, profile.HeightCm, profile.Photo));
    }
);

api.MapPut(
    "/profile/photo",
    async (PhotoInput input, ClaimsPrincipal user, AppDbContext db) =>
    {
        if (input.Photo is not null && !IsValidPhoto(input.Photo))
            return Results.BadRequest("Снимката трябва да е JPEG, PNG или WebP, до около 200 КБ.");

        var userId = GetUserId(user);
        var profile = await db.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile is null)
        {
            profile = new UserProfile { UserId = userId };
            db.Profiles.Add(profile);
        }

        profile.Photo = input.Photo;
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
);

api.MapGet(
    "/exercises",
    async (ClaimsPrincipal user, AppDbContext db) =>
    {
        var userId = GetUserId(user);
        return await db
            .Exercises.Where(e => e.UserId == null || e.UserId == userId)
            .OrderBy(e => e.Id)
            .Select(e => new ExerciseDto(e.Id, e.Name, e.MuscleGroups))
            .ToListAsync();
    }
);

api.MapPost(
    "/exercises",
    async (NewExercise input, ClaimsPrincipal user, AppDbContext db) =>
    {
        var userId = GetUserId(user);
        var name = Regex.Replace((input.Name ?? "").Trim(), @"\s+", " ");
        if (name.Length == 0 || name.Length > 60)
            return Results.BadRequest("Името трябва да е между 1 и 60 символа.");

        var groups = (input.MuscleGroups ?? new List<string>()).Distinct().ToArray();
        if (groups.Length == 0 || groups.Any(group => !allowedGroups.Contains(group)))
            return Results.BadRequest("Избери поне една валидна мускулна група.");

        var nameLower = name.ToLower();
        if (
            await db.Exercises.AnyAsync(e =>
                (e.UserId == null || e.UserId == userId) && e.Name.ToLower() == nameLower
            )
        )
            return Results.Conflict("Упражнение с такова име вече съществува.");

        var exercise = new Exercise
        {
            Name = name,
            MuscleGroups = groups,
            UserId = userId,
        };
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

api.MapGet(
    "/exercises/{id:int}/progress",
    async (int id, ClaimsPrincipal user, AppDbContext db) =>
    {
        var userId = GetUserId(user);
        if (!await AllExercisesVisible(db, userId, [id]))
            return Results.NotFound();

        var rows = await db
            .Workouts.Where(w => w.UserId == userId)
            .SelectMany(w =>
                w.Sets.Where(s => s.ExerciseId == id)
                    .Select(s => new SetRow(w.Date, s.Weight, s.Reps))
            )
            .ToListAsync();

        return Results.Ok(Stats.BuildProgress(rows));
    }
);

api.MapGet(
    "/workouts",
    async (ClaimsPrincipal user, AppDbContext db) =>
    {
        var userId = GetUserId(user);
        var rows = await db
            .Workouts.Where(w => w.UserId == userId && w.Sets.Any())
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

api.MapPost(
    "/workouts",
    async (NewWorkout workout, ClaimsPrincipal user, AppDbContext db) =>
    {
        var userId = GetUserId(user);
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

        var usedIds = workout.Exercises.Select(e => e.ExerciseId).Distinct().ToArray();
        if (!await AllExercisesVisible(db, userId, usedIds))
            return Results.BadRequest("Има упражнение, което не съществува.");

        var entity = new Workout
        {
            UserId = userId,
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
            await db.SaveChangesAsync();
            return Results.Created($"/api/workouts/{entity.Id}", new { id = entity.Id });
        }
        catch (DbUpdateException ex) when (HasSqlState(ex, PostgresErrorCodes.ForeignKeyViolation))
        {
            return Results.BadRequest("Има упражнение, което не съществува.");
        }
    }
);

api.MapDelete(
    "/workouts/{id:int}",
    async (int id, ClaimsPrincipal user, AppDbContext db) =>
    {
        var userId = GetUserId(user);
        var rows = await db
            .Workouts.Where(w => w.Id == id && w.UserId == userId)
            .ExecuteDeleteAsync();
        return rows == 0 ? Results.NotFound() : Results.NoContent();
    }
);


api.MapGet(
    "/plans",
    async (ClaimsPrincipal user, AppDbContext db) =>
    {
        var userId = GetUserId(user);
        return await db
            .Plans.Where(p => p.UserId == userId)
            .OrderBy(p => p.Id)
            .Select(p => new PlanDto(
                p.Id,
                p.Name,
                p.Exercises.OrderBy(pe => pe.Position).Select(pe => pe.ExerciseId).ToList()
            ))
            .ToListAsync();
    }
);

api.MapPost(
    "/plans",
    async (PlanInput input, ClaimsPrincipal user, AppDbContext db) =>
    {
        var userId = GetUserId(user);
        var error = ValidatePlan(input, out var name, out var exerciseIds);
        if (error is not null)
            return Results.BadRequest(error);

        if (!await AllExercisesVisible(db, userId, exerciseIds))
            return Results.BadRequest("Има упражнение, което не съществува.");

        var plan = new Plan
        {
            UserId = userId,
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

api.MapPut(
    "/plans/{id:int}",
    async (int id, PlanInput input, ClaimsPrincipal user, AppDbContext db) =>
    {
        var userId = GetUserId(user);
        var error = ValidatePlan(input, out var name, out var exerciseIds);
        if (error is not null)
            return Results.BadRequest(error);

        if (!await AllExercisesVisible(db, userId, exerciseIds))
            return Results.BadRequest("Има упражнение, което не съществува.");

        await using var transaction = await db.Database.BeginTransactionAsync();

        try
        {
            var plan = await db.Plans.FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);
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

api.MapDelete(
    "/plans/{id:int}",
    async (int id, ClaimsPrincipal user, AppDbContext db) =>
    {
        var userId = GetUserId(user);
        var rows = await db.Plans.Where(p => p.Id == id && p.UserId == userId).ExecuteDeleteAsync();
        return rows == 0 ? Results.NotFound() : Results.NoContent();
    }
);

app.Run();
