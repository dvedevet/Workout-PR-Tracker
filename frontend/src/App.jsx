import { useEffect, useState } from "react"
import { Dumbbell, History as HistoryIcon, TrendingUp } from "lucide-react"
import ExerciseList from "./components/ExerciseList"
import SessionBoard from "./components/SessionBoard"
import HistoryView from "./components/HistoryView"
import ProgressView from "./components/ProgressView"
import { createExercise, getExercises, getWorkouts, saveWorkout } from "./api"

const tabs = [
  { id: "workout", label: "Тренировка", icon: Dumbbell },
  { id: "history", label: "История", icon: HistoryIcon },
  { id: "progress", label: "Прогрес", icon: TrendingUp },
]

function App() {
  const [exercises, setExercises] = useState([])
  const [exercisesLoading, setExercisesLoading] = useState(true)
  const [exercisesError, setExercisesError] = useState(null)
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [view, setView] = useState("workout")
  const [sets, setSets] = useState([])
  const [history, setHistory] = useState([])
  const [loadError, setLoadError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    getExercises()
      .then((data) => setExercises(data))
      .catch(() =>
        setExercisesError("Упражненията не могат да се заредят. Работи ли API-то?")
      )
      .finally(() => setExercisesLoading(false))
  }, [])

  useEffect(() => {
    getWorkouts()
      .then((data) => setHistory(data))
      .catch(() =>
        setLoadError("Историята не може да се зареди. Работи ли API-то?")
      )
  }, [])

  function handleBackgroundClick(e) {
    if (e.target.closest("button, input, h1, h2, h3, p, span, li")) return
    setSelectedExercise(null)
  }

  async function handleCreateExercise(name, muscleGroups) {
    const created = await createExercise(name, muscleGroups)
    setExercises((current) => [...current, created])
    return created
  }

  function handleAddSet(newSet) {
    setSets([...sets, newSet])
  }

  function handleDeleteSet(id) {
    setSets(sets.filter((set) => set.id !== id))
  }

  async function handleFinishWorkout() {
    if (sets.length === 0 || isSaving) return

    const workoutExercises = []
    sets.forEach((set) => {
      let group = workoutExercises.find(
        (item) => item.exerciseId === set.exerciseId
      )
      if (!group) {
        group = { exerciseId: set.exerciseId, sets: [] }
        workoutExercises.push(group)
      }
      group.sets.push({ weight: set.weight, reps: set.reps })
    })

    const workout = {
      date: new Date().toLocaleDateString("sv-SE"),
      exercises: workoutExercises,
    }

    setIsSaving(true)
    try {
      await saveWorkout(workout)
      setHistory(await getWorkouts())
      setLoadError(null)
      setSets([])
      setSaveError(null)
    } catch {
      setSaveError("Тренировката не можа да се запази. Опитай пак.")
    } finally {
      setIsSaving(false)
    }
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

        {loadError && (
          <p className="mb-4 text-center text-sm text-red-500">{loadError}</p>
        )}

        {view === "workout" && (
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <ExerciseList
              exercises={exercises}
              isLoading={exercisesLoading}
              error={exercisesError}
              selectedExercise={selectedExercise}
              onSelect={setSelectedExercise}
              onCreateExercise={handleCreateExercise}
            />
            <SessionBoard
              selectedExercise={selectedExercise}
              sets={sets}
              history={history}
              isSaving={isSaving}
              saveError={saveError}
              onAddSet={handleAddSet}
              onDeleteSet={handleDeleteSet}
              onFinish={handleFinishWorkout}
            />
          </div>
        )}

        {view === "history" && <HistoryView history={history} />}
        {view === "progress" && <ProgressView history={history} />}
      </div>
    </div>
  )
}

export default App