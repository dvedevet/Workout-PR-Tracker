import { useState } from "react"
import ExerciseList from "./components/ExerciseList"
import SessionBoard from "./components/SessionBoard"

function App() {
  const [selectedExercise, setSelectedExercise] = useState(null)

  function handleBackgroundClick(e) {
    if (e.target.closest("button, input, h1, h2, h3, p, span, li")) return
    setSelectedExercise(null)
  }

  return (
    <div className="min-h-screen" onClick={handleBackgroundClick}>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-8 text-center text-3xl font-bold text-sky-900">
          Дневник за тренировки
        </h1>
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <ExerciseList
            selectedExercise={selectedExercise}
            onSelect={setSelectedExercise}
          />
          <SessionBoard selectedExercise={selectedExercise} />
        </div>
      </div>
    </div>
  )
}

export default App