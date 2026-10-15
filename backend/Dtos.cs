
record ExerciseDto(int Id, string Name, string[] MuscleGroups);
record NewExercise(string Name, List<string> MuscleGroups);

record WorkoutDto(int Id, DateOnly Date, List<WorkoutExerciseDto> Exercises);
record WorkoutExerciseDto(int ExerciseId, string Name, string[] MuscleGroups, List<SetDto> Sets);
record SetDto(decimal Weight, int Reps);

record NewWorkout(DateOnly Date, List<NewWorkoutExercise> Exercises);
record NewWorkoutExercise(int ExerciseId, List<NewSet> Sets);
record NewSet(decimal Weight, int Reps);

record PlanDto(int Id, string Name, List<int> ExerciseIds);
record PlanInput(string Name, List<int> ExerciseIds);

record ProgressPointDto(DateOnly Date, decimal OneRM, decimal MaxWeight, int MaxWeightReps, int MaxReps);