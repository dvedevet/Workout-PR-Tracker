import { useState } from "react"
import { Plus } from "lucide-react"
import { MUSCLE_GROUPS } from "../data/muscleGroups"
import { userMessage } from "../api"

function NewExerciseForm({ name, onCreate }) {
    const [groups, setGroups] = useState([])
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState(null)

    function toggleGroup(group) {
        setGroups(
            groups.includes(group)
                ? groups.filter((item) => item !== group)
                : [...groups, group]
        )
    }

    async function handleCreate() {
        if (groups.length === 0 || isSaving) return

        setIsSaving(true)
        setError(null)
        try {
            await onCreate(name, groups)
        } catch (err) {
            setError(userMessage(err))
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="mb-3 rounded-2xl border border-sky-200 bg-white/70 p-3">
            <p className="mb-2 text-xs text-slate-500">
                Избери мускулни групи (първата избрана е основна ★)
            </p>

            <div className="grid grid-cols-3 gap-2">
                {MUSCLE_GROUPS.map((group) => {
                    const isSelected = groups.includes(group)
                    const isPrimary = groups[0] === group
                    return (
                        <button
                            key={group}
                            onClick={() => toggleGroup(group)}
                            className={`rounded-full px-2 py-1.5 text-sm font-medium transition ${isSelected
                                ? "bg-sky-500 text-white shadow"
                                : "bg-white/80 text-sky-700 hover:bg-sky-100"
                                }`}
                        >
                            {isPrimary ? "★ " : ""}
                            {group}
                        </button>
                    )
                })}
            </div>

            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

            <button
                onClick={handleCreate}
                disabled={groups.length === 0 || isSaving}
                className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <Plus size={16} />
                {isSaving ? "Добавяне..." : "Добави упражнението"}
            </button>
        </div>
    )
}

export default NewExerciseForm