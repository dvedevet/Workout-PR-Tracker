import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import ExerciseCard from "./ExerciseCard"
import { exercises } from "../data/exercises"

const groups = ["Всички", "Гърди", "Гръб", "Крака", "Рамене", "Ръце"]
const PAGE_SIZE = 3

function ExerciseList({ selectedExercise, onSelect }) {
    const [activeGroup, setActiveGroup] = useState("Всички")
    const [page, setPage] = useState(0)

    const filteredExercises =
        activeGroup === "Всички"
            ? exercises
            : exercises.filter((exercise) => exercise.muscleGroup === activeGroup)

    const totalPages = Math.max(1, Math.ceil(filteredExercises.length / PAGE_SIZE))
    const start = page * PAGE_SIZE
    const visibleExercises = filteredExercises.slice(start, start + PAGE_SIZE)

    function handleGroupChange(group) {
        setActiveGroup(group)
        setPage(0)
    }

    return (
        <section className="rounded-3xl border border-white/60 bg-white/60 p-6 shadow-lg backdrop-blur-md">
            <h2 className="mb-4 text-xl font-bold text-sky-900">Упражнения</h2>

            <div className="mb-4 grid grid-cols-3 gap-2">
                {groups.map((group) => (
                    <button
                        key={group}
                        onClick={() => handleGroupChange(group)}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${activeGroup === group
                            ? "bg-sky-500 text-white shadow"
                            : "bg-white/80 text-sky-700 hover:bg-sky-100"
                            }`}
                    >
                        {group}
                    </button>
                ))}
            </div>

            <div className="grid gap-3">
                {visibleExercises.map((exercise) => (
                    <ExerciseCard
                        key={exercise.id}
                        name={exercise.name}
                        muscleGroup={exercise.muscleGroup}
                        isSelected={selectedExercise?.id === exercise.id}
                        onSelect={() => onSelect(exercise)}
                    />
                ))}
            </div>

            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                    <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 0}
                        className="rounded-full p-2 text-sky-600 transition hover:bg-sky-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm text-sky-700">
                        {page + 1} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages - 1}
                        className="rounded-full p-2 text-sky-600 transition hover:bg-sky-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </section>
    )
}

export default ExerciseList