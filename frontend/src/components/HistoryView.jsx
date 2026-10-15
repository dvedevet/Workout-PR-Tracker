import { useState } from "react"
import { CalendarDays, ChevronDown, Trash2 } from "lucide-react"
import ConfirmDialog from "./ConfirmDialog"
import { userMessage } from "../api"

function formatDate(isoDate) {
    return new Date(isoDate).toLocaleDateString("bg-BG", {
        day: "numeric",
        month: "long",
        year: "numeric",
    })
}

// Име на тренировката: основните групи на упражненията, без повторения
function getWorkoutName(workout) {
    const groups = workout.exercises.map((exercise) => exercise.muscleGroups[0])
    return [...new Set(groups)].join(" + ")
}

function HistoryView({ history, onDelete }) {
    const [openId, setOpenId] = useState(null)
    const [pending, setPending] = useState(null) // тренировката, която чака потвърждение
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState(null)

    function askDelete(workout) {
        setError(null)
        setPending(workout)
    }

    function cancelDelete() {
        if (!isDeleting) setPending(null)
    }

    async function confirmDelete() {
        setIsDeleting(true)
        setError(null)
        try {
            await onDelete(pending.id)
            setPending(null)
        } catch (err) {
            setError(userMessage(err))
        } finally {
            setIsDeleting(false)
        }
    }

    if (history.length === 0) {
        return (
            <section className="rounded-3xl border border-white/60 bg-white/60 p-6 text-sky-700 shadow-lg backdrop-blur-md">
                Още няма записани тренировки.
            </section>
        )
    }

    return (
        <section className="grid gap-3">
            {history.map((workout) => {
                const isOpen = openId === workout.id

                return (
                    <article
                        key={workout.id}
                        className="overflow-hidden rounded-3xl border border-white/60 bg-white/60 shadow-lg backdrop-blur-md"
                    >
                        <div className="flex items-center">
                            <button
                                onClick={() => setOpenId(isOpen ? null : workout.id)}
                                className="flex min-w-0 flex-1 items-center justify-between gap-3 p-5 text-left"
                            >
                                <div>
                                    <p className="font-semibold text-sky-900">
                                        {getWorkoutName(workout)}
                                    </p>
                                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                                        <CalendarDays size={14} /> {formatDate(workout.date)}
                                    </p>
                                </div>
                                <ChevronDown
                                    size={20}
                                    className={`shrink-0 text-sky-500 transition ${isOpen ? "rotate-180" : ""
                                        }`}
                                />
                            </button>
                            <button
                                onClick={() => askDelete(workout)}
                                title="Изтрий тренировката"
                                className="mr-4 shrink-0 rounded-lg p-1.5 text-sky-400 transition hover:bg-sky-100 hover:text-red-400"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        {isOpen && (
                            <div className="grid gap-4 border-t border-sky-100 px-5 pb-5 pt-4">
                                {workout.exercises.map((exercise) => (
                                    <div key={exercise.exerciseId}>
                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                            <p className="font-semibold text-sky-800">
                                                {exercise.name}
                                            </p>
                                            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                                                {exercise.muscleGroups.join(" · ")}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 text-sm">
                                            {exercise.sets.map((set, index) => (
                                                <span
                                                    key={index}
                                                    className="rounded-lg bg-sky-50 px-2 py-0.5 font-medium text-sky-800"
                                                >
                                                    <span className="text-slate-500">{index + 1}.</span>{" "}
                                                    {set.weight} кг × {set.reps}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </article>
                )
            })}

            {pending && (
                <ConfirmDialog
                    title="Изтриване на тренировка?"
                    message={`Тренировката ще бъде изтрита завинаги. Тя ще изчезне от графиката в "Прогрес", а резултатите ще се преизчислят без нея.`}
                    confirmLabel="Изтрий"
                    isBusy={isDeleting}
                    error={error}
                    onConfirm={confirmDelete}
                    onCancel={cancelDelete}
                />
            )}
        </section>
    )
}

export default HistoryView