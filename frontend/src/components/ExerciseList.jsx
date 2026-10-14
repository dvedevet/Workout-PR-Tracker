import { useState } from "react"
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react"
import ExerciseCard from "./ExerciseCard"
import NewExerciseForm from "./NewExerciseForm"
import { MUSCLE_GROUPS } from "../data/muscleGroups"

const groups = ["Всички", ...MUSCLE_GROUPS]
const PAGE_SIZE = 3

function ExerciseList({
    exercises,
    isLoading,
    error,
    selectedExercise,
    onSelect,
    onCreateExercise,
}) {
    const [query, setQuery] = useState("")
    const [activeGroup, setActiveGroup] = useState("Всички")
    const [page, setPage] = useState(0)

    const cleanQuery = query.trim().replace(/\s+/g, " ")
    const normalizedQuery = cleanQuery.toLowerCase()
    const isSearching = normalizedQuery !== ""
    const newName = cleanQuery.charAt(0).toUpperCase() + cleanQuery.slice(1)

    let filteredExercises = exercises
    if (isSearching) {
        filteredExercises = exercises.filter((exercise) =>
            exercise.name.toLowerCase().includes(normalizedQuery)
        )
    } else if (activeGroup !== "Всички") {
        filteredExercises = exercises.filter((exercise) =>
            exercise.muscleGroups.includes(activeGroup)
        )
    }

    const hasExactMatch = exercises.some(
        (exercise) => exercise.name.toLowerCase() === normalizedQuery
    )
    const canCreate = isSearching && !hasExactMatch

    const totalPages = Math.max(1, Math.ceil(filteredExercises.length / PAGE_SIZE))
    const start = page * PAGE_SIZE
    const visibleExercises = filteredExercises.slice(start, start + PAGE_SIZE)

    function handleQueryChange(value) {
        setQuery(value)
        setPage(0)
    }

    function handleGroupChange(group) {
        setActiveGroup(group)
        setQuery("")
        setPage(0)
    }

    async function handleCreate(name, muscleGroups) {
        const created = await onCreateExercise(name, muscleGroups)
        onSelect(created)
        setQuery("")
        setPage(0)
    }

    return (
        <section className="rounded-3xl border border-white/60 bg-white/60 p-6 shadow-lg backdrop-blur-md">
            <h2 className="mb-4 text-xl font-bold text-sky-900">Упражнения</h2>

            <div className="relative mb-4">
                <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sky-400"
                />
                <input
                    type="text"
                    value={query}
                    maxLength={60}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    placeholder="Търси или въведи ново упражнение"
                    className="w-full rounded-xl border border-sky-200 bg-white/80 py-2 pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-sky-300"
                />
                {query && (
                    <button
                        onClick={() => handleQueryChange("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-sky-400 transition hover:bg-sky-100"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            <div
                className={`mb-4 grid grid-cols-4 gap-2 ${isSearching ? "opacity-50" : ""
                    }`}
            >
                {groups.map((group) => (
                    <button
                        key={group}
                        onClick={() => handleGroupChange(group)}
                        className={`rounded-full px-2 py-1.5 text-sm font-medium transition ${!isSearching && activeGroup === group
                            ? "bg-sky-500 text-white shadow"
                            : "bg-white/80 text-sky-700 hover:bg-sky-100"
                            }`}
                    >
                        {group}
                    </button>
                ))}
            </div>

            {isLoading && (
                <p className="py-6 text-center text-sm text-sky-600">Зареждане...</p>
            )}

            {error && (
                <p className="py-6 text-center text-sm text-red-500">{error}</p>
            )}

            {!isLoading && !error && (
                <>
                    <div className="grid gap-3">
                        {visibleExercises.map((exercise) => (
                            <ExerciseCard
                                key={exercise.id}
                                name={exercise.name}
                                muscleGroups={exercise.muscleGroups}
                                isSelected={selectedExercise?.id === exercise.id}
                                onSelect={() => onSelect(exercise)}
                            />
                        ))}
                    </div>

                    {canCreate && (
                        <NewExerciseForm name={newName} onCreate={handleCreate} />
                    )}
                </>
            )}

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