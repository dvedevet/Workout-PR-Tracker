import { useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import PlanForm from "./PlanForm"
import { userMessage } from "../api"
import ConfirmDialog from "./ConfirmDialog"

function PlansView({
    plans,
    exercises,
    error,
    startNew,
    onCreatePlan,
    onUpdatePlan,
    onDeletePlan,
    onCreateExercise,
}) {
    const [editing, setEditing] = useState(startNew ? "new" : null) // null, "new" или id
    const [pendingDelete, setPendingDelete] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState(null)

    function exerciseName(id) {
        return exercises.find((exercise) => exercise.id === id)?.name ?? "?"
    }

    async function handleSaveNew(name, ids) {
        await onCreatePlan(name, ids)
        setEditing(null)
    }

    async function handleSaveEdit(id, name, ids) {
        await onUpdatePlan(id, name, ids)
        setEditing(null)
    }

    function askDelete(plan) {
        setDeleteError(null)
        setPendingDelete(plan)
    }

    async function confirmDelete() {
        setIsDeleting(true)
        setDeleteError(null)
        try {
            await onDeletePlan(pendingDelete.id)
            setPendingDelete(null)
        } catch (err) {
            setDeleteError(userMessage(err))
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <section className="grid gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-sky-900">График</h2>
                {editing !== "new" && (
                    <button
                        onClick={() => setEditing("new")}
                        className="flex items-center gap-1 rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-sky-600"
                    >
                        <Plus size={16} /> Нов график
                    </button>
                )}
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            {editing === "new" && (
                <PlanForm
                    key="new"
                    exercises={exercises}
                    onSave={handleSaveNew}
                    onCancel={() => setEditing(null)}
                    onCreateExercise={onCreateExercise}
                />
            )}

            {plans.length === 0 && editing !== "new" && !error && (
                <p className="rounded-3xl border border-white/60 bg-white/60 p-6 text-sm text-sky-700 shadow-lg backdrop-blur-md">
                    Още нямаш графици. Натисни „Нов график“, за да създадеш първия.
                </p>
            )}

            {plans.map((plan) =>
                editing === plan.id ? (
                    <PlanForm
                        key={plan.id}
                        plan={plan}
                        exercises={exercises}
                        onSave={(name, ids) => handleSaveEdit(plan.id, name, ids)}
                        onCancel={() => setEditing(null)}
                        onCreateExercise={onCreateExercise}
                    />
                ) : (
                    <article
                        key={plan.id}
                        className="rounded-3xl border border-white/60 bg-white/60 p-5 shadow-lg backdrop-blur-md"
                    >
                        <div className="relative">
                            <h3 className="px-20 text-center font-semibold text-sky-900">
                                {plan.name}
                            </h3>
                            <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center">
                                <button
                                    onClick={() => setEditing(plan.id)}
                                    className="rounded-lg p-1.5 text-sky-500 transition hover:bg-sky-100"
                                >
                                    <Pencil size={18} />
                                </button>
                                <button
                                    onClick={() => askDelete(plan)}
                                    className="rounded-lg p-1.5 text-sky-400 transition hover:bg-sky-100 hover:text-red-400"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                        <ol className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                            {plan.exerciseIds.map((id, index) => (
                                <li
                                    key={id}
                                    className="flex items-start gap-1.5 rounded-xl bg-sky-50 px-3 py-2 font-medium leading-tight text-sky-800"
                                >
                                    <span className="text-slate-500">{index + 1}.</span>
                                    <span>{exerciseName(id)}</span>
                                </li>
                            ))}
                        </ol>
                    </article>
                )
            )}

            {pendingDelete && (
                <ConfirmDialog
                    title="Изтриване на график?"
                    message={`Графикът ще бъде изтрит. Записаните тренировки няма да се променят.`}
                    confirmLabel="Изтрий"
                    isBusy={isDeleting}
                    error={deleteError}
                    onConfirm={confirmDelete}
                    onCancel={() => {
                        if (!isDeleting) setPendingDelete(null)
                    }}
                />
            )}

        </section>
    )
}

export default PlansView