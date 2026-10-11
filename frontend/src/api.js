const API_URL = "http://localhost:5146"

export async function getExercises() {
    const response = await fetch(`${API_URL}/api/exercises`)
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
    }
    return response.json()
}