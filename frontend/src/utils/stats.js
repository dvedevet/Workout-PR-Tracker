// Формула на Epley: теоретичен максимум за 1 повторение
export function epley1RM(weight, reps) {
    if (weight <= 0 || reps <= 0) return 0
    if (reps === 1) return weight
    return weight * (1 + reps / 30)
}

function round1(number) {
    return Math.round(number * 10) / 10
}

// Всички серии за дадено упражнение от историята
export function getHistorySets(history, exerciseId) {
    const result = []
    history.forEach((workout) => {
        workout.exercises.forEach((exercise) => {
            if (exercise.exerciseId === exerciseId) {
                result.push(...exercise.sets)
            }
        })
    })
    return result
}

// По една точка за всяка тренировка: най-доброто от нея, по дати
export function getExerciseProgress(history, exerciseId) {
    return history
        .map((workout) => {
            const entry = workout.exercises.find(
                (exercise) => exercise.exerciseId === exerciseId
            )
            if (!entry) return null

            const maxWeight = Math.max(...entry.sets.map((set) => set.weight))
            const maxWeightReps = Math.max(
                ...entry.sets
                    .filter((set) => set.weight === maxWeight)
                    .map((set) => set.reps)
            )

            return {
                date: workout.date,
                oneRM: round1(
                    Math.max(...entry.sets.map((set) => epley1RM(set.weight, set.reps)))
                ),
                maxWeight: maxWeight,
                maxWeightReps: maxWeightReps,
            }
        })
        .filter(Boolean)
        .sort((a, b) => a.date.localeCompare(b.date))
}

// Дали една серия е рекорд спрямо предишните серии на упражнението.
// Връща "1RM", "weight", "reps" или null (по приоритет в този ред).
// Какви рекорди постига една серия спрямо предишните серии на упражнението.
// Връща списък с "1RM", "weight" и/или "reps" (може да е празен).
export function getPRTypes(set, previousSets) {
    if (previousSets.length === 0) return []

    const types = []

    // 1. Нов прогнозен 1RM
    const bestOneRM = Math.max(
        ...previousSets.map((prev) => epley1RM(prev.weight, prev.reps))
    )
    if (epley1RM(set.weight, set.reps) > bestOneRM) types.push("1RM")

    // 2. Тежест: по-тежко от всякога, или най-тежката досега с повече повторения
    const heaviest = Math.max(...previousSets.map((prev) => prev.weight))
    const repsAtHeaviest = Math.max(
        ...previousSets
            .filter((prev) => prev.weight === heaviest)
            .map((prev) => prev.reps)
    )
    if (
        set.weight > 0 &&
        (set.weight > heaviest ||
            (set.weight === heaviest && set.reps > repsAtHeaviest))
    ) {
        types.push("weight")
    }

    // 3. Повторения: само ако не е вече рекорд за 1RM или тежест
    if (types.length === 0) {
        const beaten = previousSets.some(
            (prev) => prev.weight >= set.weight && prev.reps >= set.reps
        )
        if (!beaten) types.push("reps")
    }

    return types
}

// PR баджове за всяка серия от текущата тренировка.
// Ако по-късна серия на същото упражнение подобри рекорд от същия вид,
// този вид се маха от по-старата серия.
export function getSessionPRs(history, sets) {
    const allTypes = sets.map((set, index) => {
        const previousSets = [
            ...getHistorySets(history, set.exerciseId),
            ...sets
                .slice(0, index)
                .filter((earlier) => earlier.exerciseId === set.exerciseId),
        ]
        return getPRTypes(set, previousSets)
    })

    return allTypes.map((types, index) => {
        const set = sets[index]

        return types.filter((type) => {
            const isReplaced = sets.some((later, laterIndex) => {
                if (laterIndex <= index) return false
                if (later.exerciseId !== set.exerciseId) return false
                if (!allTypes[laterIndex].includes(type)) return false
                if (type === "reps") {
                    return later.weight >= set.weight && later.reps >= set.reps
                }
                return true
            })
            return !isReplaced
        })
    })
}