import { useState } from "react"

function SessionBoard() {
  const [weight, setWeight] = useState("")
  const [reps, setReps] = useState("")
  const [sets, setSets] = useState([])

  function handleAddSet() {
    if (weight === "" || reps === "") return

    const newSet = { weight: Number(weight), reps: Number(reps) }
    setSets([...sets, newSet])
    setWeight("")
    setReps("")
  }

  return (
    <div>
      <h2>Текуща тренировка</h2>

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
      <button onClick={handleAddSet}>Добави серия</button>

      <ul>
        {sets.map((set, index) => (
          <li key={index}>
            Серия {index + 1}: {set.weight} кг × {set.reps}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SessionBoard