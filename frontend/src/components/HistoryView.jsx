import { useState } from "react"
import { CalendarDays, Check, ChevronDown, Pencil, Trash2, X } from "lucide-react"
import ConfirmDialog from "./ConfirmDialog"
import ErrorMessage from "./ErrorMessage"
import { userMessage } from "../api"

function formatDate(isoDate) {
    return new Date(isoDate).toLocaleDateString("bg-BG", {
        day: "numeric",
        month: "long",
        year: "numeric",
    })
}

function getAutoName(workout) {
    const groups = workout.exercises.map((exercise) => exercise.muscleGroups[0])
    return [...new Set(groups)].join(" + ")
}

function getWorkoutName(workout) {
    return workout.name || getAutoName(workout)
}

function HistoryView({ history, onRename, onDelete }) {
    const [openId, setOpenId] = useState(null)
    const [pending, setPending] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState(null)

    const [editingId, setEditingId] = useState(null)
    const [draft, setDraft] = useState("")
    const [isRenaming, setIsRenaming] = useState(false)
    const [renameError, setRenameError] = useState(null)

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

    function startRename(workout) {
        setRenameError(null)
        setDraft(workout.name ?? "")
        setEditingId(workout.id)
    }

    function cancelRename() {
        if (isRenaming) return
        setEditingId(null)
        setRenameError(null)
    }

    async function saveRename(e) {
        e.preventDefault()
        if (isRenaming) return

        setIsRenaming(true)
        setRenameError(null)
        try {
            await onRename(editingId, draft)
            setEditingId(null)
        } catch (err) {
            setRenameError(userMessage(err))
        } finally {
            setIsRenaming(false)
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
                const isEditing = editingId === workout.id

                return (
                    <article
                        key={workout.id}
                        className="overflow-hidden rounded-3xl border border-white/60 bg-white/60 shadow-lg backdrop-blur-md"
                    >
                        {isEditing ? (
                            <form onSubmit={saveRename} className="p-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        autoFocus
                                        type="text"
                                        maxLength={60}
                                        value={draft}
                                        placeholder={getAutoName(workout)}
                                        disabled={isRenaming}
                                        onChange={(e) => setDraft(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Escape") cancelRename()
                                        }}
                                        className="min-w-0 flex-1 rounded-xl border border-sky-200 bg-white px-3 py-2 text-base font-semibold text-sky-900 outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-50"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isRenaming}
                                        title="Запази името"
                                        className="shrink-0 rounded-lg bg-sky-500 p-2 text-white shadow transition hover:bg-sky-600 disabled:opacity-50"
                                    >
                                        <Check size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={cancelRename}
                                        disabled={isRenaming}
                                        title="Откажи"
                                        className="shrink-0 rounded-lg p-2 text-sky-500 transition hover:bg-sky-100 disabled:opacity-50"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                <ErrorMessage className="mt-3">{renameError}</ErrorMessage>
                            </form>
                        ) : (
                            <div className="flex items-center">
                                <button
                                    onClick={() => setOpenId(isOpen ? null : workout.id)}
                                    className="flex min-w-0 flex-1 items-center justify-between gap-3 p-5 text-left"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold text-sky-900">
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
                                    onClick={() => startRename(workout)}
                                    title="Промени името"
                                    className="shrink-0 rounded-lg p-1.5 text-sky-400 transition hover:bg-sky-100 hover:text-sky-600"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => askDelete(workout)}
                                    title="Изтрий тренировката"
                                    className="mr-4 shrink-0 rounded-lg p-1.5 text-sky-400 transition hover:bg-sky-100 hover:text-red-400"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        )}

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
