
public class Exercise
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string[] MuscleGroups { get; set; } = [];
}

public class Workout
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }
    public List<WorkoutSet> Sets { get; set; } = [];
}

public class WorkoutSet
{
    public int Id { get; set; }
    public int WorkoutId { get; set; }
    public int ExerciseId { get; set; }
    public Exercise Exercise { get; set; } = null!;
    public int SetNumber { get; set; }
    public decimal Weight { get; set; }
    public int Reps { get; set; }
}

public class Plan
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public List<PlanExercise> Exercises { get; set; } = [];
}

public class PlanExercise
{
    public int PlanId { get; set; }
    public int ExerciseId { get; set; }
    public int Position { get; set; }
}