import ExerciseCard from "./ExerciseCard"
import { exercises } from "../data/exercises"

function ExerciseList({ selectedExercise, onSelect }) {
  return (
    <div>
      <h2>Упражнения</h2>
      {exercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          name={exercise.name}
          muscleGroup={exercise.muscleGroup}
          isSelected={selectedExercise?.id === exercise.id}
          onSelect={() => onSelect(exercise)}
        />
      ))}
    </div>
  )
}

export default ExerciseList