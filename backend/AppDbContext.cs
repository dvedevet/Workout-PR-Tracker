using Microsoft.EntityFrameworkCore;
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Exercise> Exercises => Set<Exercise>();
    public DbSet<Workout> Workouts => Set<Workout>();
    public DbSet<WorkoutSet> WorkoutSets => Set<WorkoutSet>();
    public DbSet<Plan> Plans => Set<Plan>();
    public DbSet<PlanExercise> PlanExercises => Set<PlanExercise>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Exercise>(e =>
        {
            e.ToTable("exercises");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Name).HasColumnName("name");
            e.Property(x => x.MuscleGroups).HasColumnName("muscle_groups");
        });

        modelBuilder.Entity<Workout>(e =>
        {
            e.ToTable("workouts");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Date).HasColumnName("workout_date");
            e.HasMany(x => x.Sets)
                .WithOne()
                .HasForeignKey(x => x.WorkoutId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<WorkoutSet>(e =>
        {
            e.ToTable("workout_sets");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.WorkoutId).HasColumnName("workout_id");
            e.Property(x => x.ExerciseId).HasColumnName("exercise_id");
            e.Property(x => x.SetNumber).HasColumnName("set_number");
            e.Property(x => x.Weight).HasColumnName("weight").HasColumnType("numeric(6,2)");
            e.Property(x => x.Reps).HasColumnName("reps");
            e.HasOne(x => x.Exercise)
                .WithMany()
                .HasForeignKey(x => x.ExerciseId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Plan>(e =>
        {
            e.ToTable("plans");
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.Name).HasColumnName("name");
            e.HasMany(x => x.Exercises)
                .WithOne()
                .HasForeignKey(x => x.PlanId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PlanExercise>(e =>
        {
            e.ToTable("plan_exercises");
            e.HasKey(x => new { x.PlanId, x.ExerciseId });
            e.Property(x => x.PlanId).HasColumnName("plan_id");
            e.Property(x => x.ExerciseId).HasColumnName("exercise_id");
            e.Property(x => x.Position).HasColumnName("position");
            e.HasOne<Exercise>()
                .WithMany()
                .HasForeignKey(x => x.ExerciseId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}