const API_URL = "http://localhost:5146"

async function readError(response) {
    try {
        const message = await response.json()
        if (typeof message === "string") return message
    } catch {
        // отговорът не е JSON, ползваме общо съобщение
    }
    return `Грешка от API-то: ${response.status}`
}

export async function getExercises() {
    const response = await fetch(`${API_URL}/api/exercises`)
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
    }
    return response.json()
}

export async function createExercise(name, muscleGroups) {
    const response = await fetch(`${API_URL}/api/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, muscleGroups }),
    })
    if (!response.ok) {
        throw new Error(await readError(response))
    }
    return response.json()
}

export async function getWorkouts() {
    const response = await fetch(`${API_URL}/api/workouts`)
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
    }
    return response.json()
}

export async function saveWorkout(workout) {
    const response = await fetch(`${API_URL}/api/workouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workout),
    })
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
    }
    return response.json()
}