export function epley1RM(weight, reps) {
    if (weight <= 0 || reps <= 0) return 0
    if (reps === 1) return weight
    return weight * (1 + reps / 30)
}

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

export function getPRTypes(set, previousSets) {
    if (previousSets.length === 0) return []

    const types = []

    const bestOneRM = Math.max(
        ...previousSets.map((prev) => epley1RM(prev.weight, prev.reps))
    )
    if (epley1RM(set.weight, set.reps) > bestOneRM) types.push("1RM")

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

    if (set.weight === 0) {
        const bestReps = Math.max(...previousSets.map((prev) => prev.reps))
        if (set.reps > bestReps) types.push("reps")
    }

    return types
}

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

export function getPersonalRecord(history, exerciseId, sessionSets = []) {
    const sets = [...getHistorySets(history, exerciseId), ...sessionSets]
    if (sets.length === 0) return null

    const maxWeight = Math.max(...sets.map((set) => set.weight))
    if (maxWeight > 0) {
        const bestOneRM = Math.max(
            ...sets.map((set) => epley1RM(set.weight, set.reps))
        )
        return { type: "weight", maxWeight, oneRM: bestOneRM }
    }

    return { type: "reps", maxReps: Math.max(...sets.map((set) => set.reps)) }
}
