import { useState } from "react"
import { Plus, Trash2, Check, Trophy } from "lucide-react"
import { getSessionPRs } from "../utils/stats"

const prLabels = { "1RM": "1RM", weight: "тежест", reps: "повт." }

function SessionBoard({
    selectedExercise,
    sets,
    history,
    onAddSet,
    onDeleteSet,
    onFinish,
}) {
    const [weight, setWeight] = useState("")
    const [reps, setReps] = useState("")

    function handleSubmit() {
        if (!selectedExercise || weight === "" || reps === "") return

        onAddSet({
            id: Date.now(),
            exerciseId: selectedExercise.id,
            exerciseName: selectedExercise.name,
            muscleGroup: selectedExercise.muscleGroup,
            weight: Number(weight),
            reps: Number(reps),
        })
        setWeight("")
        setReps("")
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

    const prTypes = getSessionPRs(history, sets)

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
                    inputMode="decimal"
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
                    onClick={handleSubmit}
                    disabled={!selectedExercise}
                    className="col-span-2 flex items-center justify-center gap-1 rounded-xl bg-sky-500 px-4 py-2 font-medium text-white shadow transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-1"
                >
                    <Plus size={18} /> Добави
                </button>
            </div>

            <ul className="grid gap-2">
                {sets.map((set, index) => {
                    const setPRs = prTypes[index]

                    return (
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
                                    {setPRs.length > 0 && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                                            <Trophy size={12} />
                                            NEW PR · {setPRs.map((type) => prLabels[type]).join(" + ")}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-2 flex flex-wrap gap-1.5 text-sm">
                                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-slate-600">
                                        Серия {getSetNumber(index)}
                                    </span>
                                    <span className="rounded-lg bg-sky-50 px-2 py-0.5 font-medium text-sky-800">
                                        {set.weight} кг
                                    </span>
                                    <span className="rounded-lg bg-sky-50 px-2 py-0.5 font-medium text-sky-800">
                                        {set.reps} повт.
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => onDeleteSet(set.id)}
                                className="shrink-0 rounded-lg p-1.5 text-sky-400 transition hover:bg-sky-100 hover:text-red-400"
                            >
                                <Trash2 size={18} />
                            </button>
                        </li>
                    )
                })}
            </ul>

            {sets.length > 0 && (
                <button
                    onClick={onFinish}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 font-medium text-white shadow transition hover:bg-sky-700"
                >
                    <Check size={18} /> Завърши тренировката
                </button>
            )}
        </section>
    )
}

export default SessionBoard