import ExerciseCard from "./ExerciseCard"
import { exercises } from "../data/exercises"

function ExerciseList() {
  return (
    <div>
      <h2>Упражнения</h2>
      {exercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          name={exercise.name}
          muscleGroup={exercise.muscleGroup}
        />
      ))}
    </div>
  )
}

export default ExerciseList