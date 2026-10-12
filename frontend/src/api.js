const API_URL = "http://localhost:5146"

export async function getExercises() {
    const response = await fetch(`${API_URL}/api/exercises`)
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
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