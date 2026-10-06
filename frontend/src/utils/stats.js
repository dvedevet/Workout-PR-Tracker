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

            const repsSet = entry.sets.reduce((best, set) =>
                set.reps > best.reps || (set.reps === best.reps && set.weight > best.weight)
                    ? set
                    : best
            )

            return {
                date: workout.date,
                oneRM: round1(
                    Math.max(...entry.sets.map((set) => epley1RM(set.weight, set.reps)))
                ),
                maxReps: repsSet.reps,
                repsWeight: repsSet.weight,
                maxWeight: Math.max(...entry.sets.map((set) => set.weight)),
            }
        })
        .filter(Boolean)
        .sort((a, b) => a.date.localeCompare(b.date))
}

// Дали една серия е рекорд спрямо предишните серии на упражнението
export function getPRType(set, previousSets) {
    if (previousSets.length === 0) return null

    const bestOneRM = Math.max(
        ...previousSets.map((prev) => epley1RM(prev.weight, prev.reps))
    )
    if (epley1RM(set.weight, set.reps) > bestOneRM) return "1RM"

    const sameWeight = previousSets.filter((prev) => prev.weight === set.weight)
    if (
        sameWeight.length > 0 &&
        set.reps > Math.max(...sameWeight.map((prev) => prev.reps))
    ) {
        return "reps"
    }

    return null
}