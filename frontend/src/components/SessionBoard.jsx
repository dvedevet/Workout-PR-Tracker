import { useState } from "react"

function SessionBoard({ selectedExercise }) {
  const [weight, setWeight] = useState("")
  const [reps, setReps] = useState("")
  const [sets, setSets] = useState([])

  function handleAddSet() {
  if (!selectedExercise || weight === "" || reps === "") return

  const setNumber =
    sets.filter((set) => set.exerciseId === selectedExercise.id).length + 1

  const newSet = {
    exerciseId: selectedExercise.id,
    exerciseName: selectedExercise.name,
    setNumber: setNumber,
    weight: Number(weight),
    reps: Number(reps),
  }
  setSets([...sets, newSet])
  setWeight("")
  setReps("")
}

  return (
    <div>
      <h2>Текуща тренировка</h2>
      <p>
        {selectedExercise
          ? `Упражнение: ${selectedExercise.name}`
          : "Избери упражнение отгоре"}
      </p>

      <input
        type="number"
        placeholder="Тежест (кг)"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
      />
      <input
        type="number"
        placeholder="Повторения"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
      />
      <button onClick={handleAddSet} disabled={!selectedExercise}>
        Добави серия
      </button>

      <ul>
        {sets.map((set, index) => (
            <li key={index}>
            {set.exerciseName} - серия {set.setNumber}: {set.weight} кг × {set.reps}
            </li>
        ))}
      </ul>
    </div>
  )
}

export default SessionBoard