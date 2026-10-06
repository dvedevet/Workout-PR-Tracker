import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"

function SessionBoard({ selectedExercise }) {
    const [weight, setWeight] = useState("")
    const [reps, setReps] = useState("")
    const [sets, setSets] = useState([])

    function handleAddSet() {
        if (!selectedExercise || weight === "" || reps === "") return

        const newSet = {
            id: Date.now(),
            exerciseId: selectedExercise.id,
            exerciseName: selectedExercise.name,
            muscleGroup: selectedExercise.muscleGroup,
            weight: Number(weight),
            reps: Number(reps),
        }
        setSets([...sets, newSet])
        setWeight("")
        setReps("")
    }

    function handleDeleteSet(id) {
        setSets(sets.filter((set) => set.id !== id))
    }

    function getSetNumber(index) {
        const current = sets[index]
        return (
            sets.slice(0, index).filter((set) => set.exerciseId === current.exerciseId)
                .length + 1
        )
    }

    const inputClass =
        "min-w-0 w-full rounded-xl border border-sky-200 bg-white/80 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-300"

    return (
        <section className="rounded-3xl border border-white/60 bg-white/60 p-6 shadow-lg backdrop-blur-md">
            <h2 className="mb-1 text-xl font-bold text-sky-900">Текуща тренировка</h2>
            <p className="mb-4 text-sm text-sky-600">
                {selectedExercise
                    ? `Упражнение: ${selectedExercise.name}`
                    : "Избери упражнение отляво"}
            </p>

            <div className="mb-4 grid grid-cols-2 gap-2 sm:flex">
                <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Тежест (кг)"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className={inputClass}
                />
                <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Повторения"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    className={inputClass}
                />
                <button
                    onClick={handleAddSet}
                    disabled={!selectedExercise}
                    className="col-span-2 flex items-center justify-center gap-1 rounded-xl bg-sky-500 px-4 py-2 font-medium text-white shadow transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-1"
                >
                    <Plus size={18} /> Добави
                </button>
            </div>

            <ul className="grid gap-2">
                {sets.map((set, index) => (
                    <li
                        key={set.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-white/80 px-4 py-3 shadow-sm"
                    >
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-sky-800">{set.exerciseName}</p>
                                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                                    {set.muscleGroup}
                                </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5 text-sm">
                                <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-slate-600">
                                    Серия {getSetNumber(index)}
                                </span>
                                <span className="rounded-lg bg-sky-50 px-2 py-0.5 font-medium text-sky-800">
                                    {set.weight} кг.
                                </span>
                                <span className="rounded-lg bg-sky-50 px-2 py-0.5 font-medium text-sky-800">
                                    {set.reps} повт.
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => handleDeleteSet(set.id)}
                            className="shrink-0 rounded-lg p-1.5 text-sky-400 transition hover:bg-sky-100 hover:text-red-400"
                        >
                            <Trash2 size={18} />
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    )
}

export default SessionBoard