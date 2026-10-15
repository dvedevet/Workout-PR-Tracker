const API_URL = "http://localhost:5146"

export class ApiError extends Error { }

// Какво се показва на потребителя: съобщението на API-то или общо съобщение
export function userMessage(err) {
    return err instanceof ApiError
        ? err.message
        : "Нещо се обърка. Провери дали API-то работи и опитай пак."
}

async function readError(response) {
    try {
        const message = await response.json()
        if (typeof message === "string") return message
    } catch {
        // отговорът не е JSON, ползваме общо съобщение
    }
    return `Грешка от API-то (${response.status}).`
}

async function request(path, options) {
    const response = await fetch(`${API_URL}${path}`, options)
    if (!response.ok) {
        throw new ApiError(await readError(response))
    }
    return response
}

function jsonRequest(method, body) {
    return {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    }
}

export async function getExercises() {
    return (await request("/api/exercises")).json()
}

export async function createExercise(name, muscleGroups) {
    const response = await request(
        "/api/exercises",
        jsonRequest("POST", { name, muscleGroups })
    )
    return response.json()
}

export async function getWorkouts() {
    return (await request("/api/workouts")).json()
}

export async function saveWorkout(workout) {
    const response = await request("/api/workouts", jsonRequest("POST", workout))
    return response.json()
}

export async function getPlans() {
    return (await request("/api/plans")).json()
}

export async function createPlan(name, exerciseIds) {
    const response = await request(
        "/api/plans",
        jsonRequest("POST", { name, exerciseIds })
    )
    return response.json()
}

export async function updatePlan(id, name, exerciseIds) {
    const response = await request(
        `/api/plans/${id}`,
        jsonRequest("PUT", { name, exerciseIds })
    )
    return response.json()
}

export async function deletePlan(id) {
    await request(`/api/plans/${id}`, { method: "DELETE" })
}

export async function deleteWorkout(id) {
    await request(`/api/workouts/${id}`, { method: "DELETE" })
}

export async function getProgress(exerciseId) {
    return (await request(`/api/exercises/${exerciseId}/progress`)).json()
}