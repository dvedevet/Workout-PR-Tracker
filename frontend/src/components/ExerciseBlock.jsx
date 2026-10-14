import { useState } from "react"
import { Plus, Trash2, Trophy, X } from "lucide-react"

const prLabels = { "1RM": "1RM", weight: "тежест", reps: "повт." }

function formatShortDate(isoDate) {
    return new Date(isoDate).toLocaleDateString("bg-BG", {
        day: "numeric",
        month: "short",
    })
}

function ExerciseBlock({
    exercise,
    sets,
    prById,
    lastTime,
    isSelected,
    onAddSet,
    onDeleteSet,
    onRemove,
}) {
    const [weight, setWeight] = useState("")
    const [reps, setReps] = useState("")

    const isValid =
        weight !== "" && reps !== "" && Number(weight) >= 0 && Number(reps) > 0

    function handleSubmit() {
        if (!isValid) return

        onAddSet({
            id: Date.now(),
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            muscleGroups: exercise.muscleGroups,
            weight: Number(weight),
            reps: Number(reps),
        })
        setWeight("")
        setReps("")
    }

    function handleKeyDown(e) {
        if (e.key === "Enter") handleSubmit()
    }

    const inputClass =
        "min-w-0 w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300"

    return (
        <div
            data-keep-selection
            className={`rounded-2xl bg-white/80 p-4 shadow-sm ${isSelected ? "ring-2 ring-sky-300" : ""
                }`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-sky-900">{exercise.name}</h3>
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                            {exercise.muscleGroups.join(" · ")}
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                        {lastTime
                            ? `Миналия път (${formatShortDate(lastTime.date)}): ${lastTime.sets
                                .map((set) => `${set.weight} кг × ${set.reps}`)
                                .join(", ")}`
                            : "Още не си правил това упражнение."}
                    </p>
                </div>
                {onRemove && (
                    <button
                        onClick={onRemove}
                        title="Махни от тази тренировка"
                        className="shrink-0 rounded-lg p-1 text-sky-400 transition hover:bg-sky-100 hover:text-red-400"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {sets.length > 0 && (
                <ul className="mt-3 grid gap-1.5">
                    {sets.map((set, index) => {
                        const setPRs = prById[set.id] ?? []

                        return (
                            <li
                                key={set.id}
                                className="flex items-center justify-between gap-2 rounded-xl bg-sky-50/70 px-3 py-2"
                            >
                                <div className="flex flex-wrap items-center gap-1.5 text-sm">
                                    <span className="rounded-lg bg-white px-2 py-0.5 text-slate-600">
                                        Серия {index + 1}
                                    </span>
                                    <span className="rounded-lg bg-white px-2 py-0.5 font-medium text-sky-800">
                                        {set.weight} кг
                                    </span>
                                    <span className="rounded-lg bg-white px-2 py-0.5 font-medium text-sky-800">
                                        {set.reps} повт.
                                    </span>
                                    {setPRs.length > 0 && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                                            <Trophy size={12} />
                                            NEW PR · {setPRs.map((type) => prLabels[type]).join(" + ")}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => onDeleteSet(set.id)}
                                    className="shrink-0 rounded-lg p-1 text-sky-400 transition hover:bg-sky-100 hover:text-red-400"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </li>
                        )
                    })}
                </ul>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2 sm:flex">
                <input
                    type="number"
                    inputMode="decimal"
                    placeholder="Тежест (кг)"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={inputClass}
                />
                <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Повторения"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={inputClass}
                />
                <button
                    onClick={handleSubmit}
                    disabled={!isValid}
                    className="col-span-2 flex items-center justify-center gap-1 rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-1"
                >
                    <Plus size={16} /> Добави
                </button>
            </div>
        </div>
    )
}

export default ExerciseBlock