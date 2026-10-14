import { useState } from "react"
import { ArrowDown, ArrowUp, X } from "lucide-react"
import NewExerciseForm from "./NewExerciseForm"
import { userMessage } from "../api"

function PlanForm({ plan, exercises, onSave, onCancel, onCreateExercise }) {
    const [name, setName] = useState(plan?.name ?? "")
    const [ids, setIds] = useState(plan ? [...plan.exerciseIds] : [])
    const [query, setQuery] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState(null)

    const cleanName = name.trim().replace(/\s+/g, " ")
    const cleanQuery = query.trim().replace(/\s+/g, " ")
    const normalizedQuery = cleanQuery.toLowerCase()
    const newName = cleanQuery.charAt(0).toUpperCase() + cleanQuery.slice(1)

    const hasChanges =
        !plan ||
        cleanName !== plan.name ||
        ids.length !== plan.exerciseIds.length ||
        ids.some((id, index) => id !== plan.exerciseIds[index])

    const available = exercises.filter(
        (exercise) =>
            !ids.includes(exercise.id) &&
            exercise.name.toLowerCase().includes(normalizedQuery)
    )
    const exactMatch = exercises.find(
        (exercise) => exercise.name.toLowerCase() === normalizedQuery
    )
    const canCreate = normalizedQuery !== "" && !exactMatch
    const alreadyAdded = exactMatch && ids.includes(exactMatch.id)

    function addExercise(id) {
        setIds((current) => (current.includes(id) ? current : [...current, id]))
        setQuery("")
    }

    function removeExercise(id) {
        setIds((current) => current.filter((item) => item !== id))
    }

    function move(index, delta) {
        const target = index + delta
        if (target < 0 || target >= ids.length) return

        const next = [...ids]
        const [item] = next.splice(index, 1)
        next.splice(target, 0, item)
        setIds(next)
    }

    async function handleCreateExercise(exerciseName, groups) {
        const created = await onCreateExercise(exerciseName, groups)
        addExercise(created.id)
    }

    async function handleSave() {
        if (isSaving) return

        // Без реални промени няма какво да се праща
        if (!hasChanges) {
            onCancel()
            return
        }

        setIsSaving(true)
        setError(null)
        try {
            await onSave(cleanName, ids)
        } catch (err) {
            setError(userMessage(err))
        } finally {
            setIsSaving(false)
        }
    }

    const canSave = cleanName !== "" && ids.length > 0 && !isSaving

    return (
        <div className="rounded-3xl border border-sky-200 bg-white/70 p-6 shadow-lg backdrop-blur-md">
            <h3 className="mb-3 text-lg font-bold text-sky-900">
                {plan ? "Редакция на график" : "Нов график"}
            </h3>

            <input
                type="text"
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
                placeholder="Име на графика (напр. Гърди и гръб)"
                className="mb-4 w-full rounded-xl border border-sky-200 bg-white/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300"
            />

            <p className="mb-2 text-sm font-medium text-sky-800">
                Упражнения в графика ({ids.length})
            </p>
            {ids.length === 0 ? (
                <p className="mb-4 text-sm text-slate-500">Още не си добавил упражнения.</p>
            ) : (
                <ul className="mb-4 grid gap-2">
                    {ids.map((id, index) => {
                        const exercise = exercises.find((item) => item.id === id)
                        if (!exercise) return null
                        return (
                            <li
                                key={id}
                                className="flex items-center justify-between gap-2 rounded-xl bg-white/80 px-3 py-2 shadow-sm"
                            >
                                <span className="text-sm text-slate-800">
                                    <span className="mr-2 text-slate-400">{index + 1}.</span>
                                    {exercise.name}
                                </span>
                                <span className="flex shrink-0 items-center">
                                    <button
                                        onClick={() => move(index, -1)}
                                        disabled={index === 0}
                                        className="rounded-lg p-1 text-sky-500 transition hover:bg-sky-100 disabled:opacity-30 disabled:hover:bg-transparent"
                                    >
                                        <ArrowUp size={16} />
                                    </button>
                                    <button
                                        onClick={() => move(index, 1)}
                                        disabled={index === ids.length - 1}
                                        className="rounded-lg p-1 text-sky-500 transition hover:bg-sky-100 disabled:opacity-30 disabled:hover:bg-transparent"
                                    >
                                        <ArrowDown size={16} />
                                    </button>
                                    <button
                                        onClick={() => removeExercise(id)}
                                        className="rounded-lg p-1 text-sky-400 transition hover:bg-sky-100 hover:text-red-400"
                                    >
                                        <X size={16} />
                                    </button>
                                </span>
                            </li>
                        )
                    })}
                </ul>
            )}

            <p className="mb-2 text-sm font-medium text-sky-800">Добави упражнение</p>
            <input
                type="text"
                value={query}
                maxLength={60}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Търси или въведи ново упражнение"
                className="mb-2 w-full rounded-xl border border-sky-200 bg-white/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300"
            />

            {canCreate && (
                <NewExerciseForm name={newName} onCreate={handleCreateExercise} />
            )}

            {alreadyAdded && (
                <p className="mb-2 text-xs text-slate-500">
                    „{exactMatch.name}“ вече е в графика.
                </p>
            )}

            {available.length > 0 && (
                <ul className="mb-2 max-h-48 overflow-y-auto rounded-xl bg-white/60 p-1">
                    {available.map((exercise) => (
                        <li key={exercise.id}>
                            <button
                                onClick={() => addExercise(exercise.id)}
                                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-sm transition hover:bg-sky-100"
                            >
                                <span className="text-slate-800">{exercise.name}</span>
                                <span className="shrink-0 text-xs text-sky-600">
                                    {exercise.muscleGroups.join(" · ")}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

            <div className="mt-4 flex gap-2">
                <button
                    onClick={handleSave}
                    disabled={!canSave}
                    className="flex-1 rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isSaving ? "Запазване..." : "Запази графика"}
                </button>
                <button
                    onClick={onCancel}
                    className="rounded-xl bg-white/80 px-4 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
                >
                    Откажи
                </button>
            </div>
        </div>
    )
}

export default PlanForm