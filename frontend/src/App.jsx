import { useEffect, useState } from "react"
import {
  ClipboardList,
  Dumbbell,
  History as HistoryIcon,
  TrendingUp,
} from "lucide-react"
import ExerciseList from "./components/ExerciseList"
import PlansView from "./components/PlansView"
import SessionBoard from "./components/SessionBoard"
import HistoryView from "./components/HistoryView"
import ProgressView from "./components/ProgressView"
import {
  createExercise,
  createPlan,
  deletePlan,
  getExercises,
  getPlans,
  getWorkouts,
  saveWorkout,
  updatePlan,
} from "./api"

const tabs = [
  { id: "workout", label: "Тренировка", icon: Dumbbell },
  { id: "plans", label: "График", icon: ClipboardList },
  { id: "history", label: "История", icon: HistoryIcon },
  { id: "progress", label: "Прогрес", icon: TrendingUp },
]

function App() {
  const [exercises, setExercises] = useState([])
  const [exercisesLoading, setExercisesLoading] = useState(true)
  const [exercisesError, setExercisesError] = useState(null)
  const [plans, setPlans] = useState([])
  const [plansError, setPlansError] = useState(null)
  const [plansStartNew, setPlansStartNew] = useState(false)
  const [activePlan, setActivePlan] = useState(null)
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
    getPlans()
      .then((data) => setPlans(data))
      .catch(() =>
        setPlansError("Графиците не могат да се заредят. Работи ли API-то?")
      )
  }, [])

  useEffect(() => {
    getWorkouts()
      .then((data) => setHistory(data))
      .catch(() =>
        setLoadError("Историята не може да се зареди. Работи ли API-то?")
      )
  }, [])

  function handleBackgroundClick(e) {
    if (
      e.target.closest(
        "button, input, select, h1, h2, h3, p, span, li, [data-keep-selection]"
      )
    )
      return
    setSelectedExercise(null)
  }

  function handleTabClick(tabId) {
    setPlansStartNew(false)
    setView(tabId)
  }

  function handleGoToPlans() {
    setPlansStartNew(true)
    setView("plans")
  }

  async function handleCreateExercise(name, muscleGroups) {
    const created = await createExercise(name, muscleGroups)
    setExercises((current) => [...current, created])
    return created
  }

  async function handleCreatePlan(name, exerciseIds) {
    const created = await createPlan(name, exerciseIds)
    setPlans((current) => [...current, created])
  }

  async function handleUpdatePlan(id, name, exerciseIds) {
    const updated = await updatePlan(id, name, exerciseIds)
    setPlans((current) =>
      current.map((plan) => (plan.id === id ? updated : plan))
    )
  }

  async function handleDeletePlan(id) {
    await deletePlan(id)
    setPlans((current) => current.filter((plan) => plan.id !== id))
  }

  function handleLoadPlan(planId) {
    const plan = plans.find((item) => item.id === planId)
    if (!plan) {
      setActivePlan(null)
      return
    }

    // Тренировката получава КОПИЕ на списъка, за да не променя графика
    setActivePlan({
      id: plan.id,
      name: plan.name,
      exerciseIds: [...plan.exerciseIds],
    })
  }

  function handleRemoveFromActivePlan(exerciseId) {
    setActivePlan((current) =>
      current
        ? {
          ...current,
          exerciseIds: current.exerciseIds.filter((id) => id !== exerciseId),
        }
        : current
    )
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
      setActivePlan(null)
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

        <nav className="mb-8 flex flex-wrap justify-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
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
              exercises={exercises}
              plans={plans}
              activePlan={activePlan}
              selectedExercise={selectedExercise}
              sets={sets}
              history={history}
              isSaving={isSaving}
              saveError={saveError}
              onLoadPlan={handleLoadPlan}
              onClearPlan={() => setActivePlan(null)}
              onRemoveFromPlan={handleRemoveFromActivePlan}
              onGoToPlans={handleGoToPlans}
              onAddSet={handleAddSet}
              onDeleteSet={handleDeleteSet}
              onFinish={handleFinishWorkout}
            />
          </div>
        )}

        {view === "plans" && (
          <PlansView
            plans={plans}
            exercises={exercises}
            error={plansError}
            startNew={plansStartNew}
            onCreatePlan={handleCreatePlan}
            onUpdatePlan={handleUpdatePlan}
            onDeletePlan={handleDeletePlan}
            onCreateExercise={handleCreateExercise}
          />
        )}

        {view === "history" && <HistoryView history={history} />}
        {view === "progress" && <ProgressView history={history} />}
      </div>
    </div>
  )
}

export default App