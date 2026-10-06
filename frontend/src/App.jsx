import { useState } from "react"
import { Dumbbell, History as HistoryIcon } from "lucide-react"
import ExerciseList from "./components/ExerciseList"
import SessionBoard from "./components/SessionBoard"
import HistoryView from "./components/HistoryView"

const tabs = [
  { id: "workout", label: "Тренировка", icon: Dumbbell },
  { id: "history", label: "История", icon: HistoryIcon },
]

function App() {
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [view, setView] = useState("workout")

  function handleBackgroundClick(e) {
    if (e.target.closest("button, input, h1, h2, h3, p, span, li")) return
    setSelectedExercise(null)
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

        <div
          className={`grid items-start gap-6 lg:grid-cols-2 ${view === "workout" ? "" : "hidden"
            }`}
        >
          <ExerciseList
            selectedExercise={selectedExercise}
            onSelect={setSelectedExercise}
          />
          <SessionBoard selectedExercise={selectedExercise} />
        </div>

        {view === "history" && <HistoryView />}
      </div>
    </div>
  )
}

export default App