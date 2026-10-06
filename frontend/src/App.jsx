import { useState } from "react"
import { Dumbbell, History as HistoryIcon } from "lucide-react"
import ExerciseList from "./components/ExerciseList"
import SessionBoard from "./components/SessionBoard"
import HistoryView from "./components/HistoryView"
import { history as initialHistory } from "./data/history"

const tabs = [
  { id: "workout", label: "Тренировка", icon: Dumbbell },
  { id: "history", label: "История", icon: HistoryIcon },
]

function App() {
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [view, setView] = useState("workout")
  const [sets, setSets] = useState([])
  const [history, setHistory] = useState(initialHistory)

  function handleBackgroundClick(e) {
    if (e.target.closest("button, input, h1, h2, h3, p, span, li")) return
    setSelectedExercise(null)
  }

  function handleAddSet(newSet) {
    setSets([...sets, newSet])
  }

  function handleDeleteSet(id) {
    setSets(sets.filter((set) => set.id !== id))
  }

  function handleFinishWorkout() {
    if (sets.length === 0) return

    const exercises = []
    sets.forEach((set) => {
      let group = exercises.find((item) => item.exerciseId === set.exerciseId)
      if (!group) {
        group = {
          exerciseId: set.exerciseId,
          name: set.exerciseName,
          muscleGroup: set.muscleGroup,
          sets: [],
        }
        exercises.push(group)
      }
      group.sets.push({ weight: set.weight, reps: set.reps })
    })

    const workout = {
      id: Date.now(),
      date: new Date().toLocaleDateString("sv-SE"),
      exercises: exercises,
    }

    setHistory([workout, ...history])
    setSets([])
  }

  return (
    <div className="min-h-screen" onClick={handleBackgroundClick}>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-6 text-center text-3xl font-bold text-sky-900">
          Дневник за тренировки
        </h1>

        <nav className="mb-8 flex justify-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition ${view === tab.id
                    ? "bg-sky-500 text-white shadow"
                    : "bg-white/70 text-sky-700 hover:bg-sky-100"
                  }`}
              >
                <Icon size={18} /> {tab.label}
              </button>
            )
          })}
        </nav>

        {view === "workout" && (
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <ExerciseList
              selectedExercise={selectedExercise}
              onSelect={setSelectedExercise}
            />
            <SessionBoard
              selectedExercise={selectedExercise}
              sets={sets}
              onAddSet={handleAddSet}
              onDeleteSet={handleDeleteSet}
              onFinish={handleFinishWorkout}
            />
          </div>
        )}

        {view === "history" && <HistoryView history={history} />}
      </div>
    </div>
  )
}

export default App