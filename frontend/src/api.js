import { supabase } from "./supabase"

const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "")

if (!API_URL) {
    throw new Error("Липсва VITE_API_URL във frontend/.env")
}

export class ApiError extends Error { }

export function userMessage(err) {
    return err instanceof ApiError
        ? err.message
        : "Нещо се обърка."
}

async function readError(response) {
    try {
        const message = await response.json()
        if (typeof message === "string") return message
    } catch {
    }
    return `Грешка от API: (${response.status}).`
}

async function request(path, options = {}) {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            ...options.headers,
            ...(token && { Authorization: `Bearer ${token}` }),
        },
    })

    if (response.status === 401) {
        await supabase.auth.signOut()
        throw new ApiError("Сесията ти изтече. Влез отново.")
    }

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

export async function renameWorkout(id, name) {
    const response = await request(
        `/api/workouts/${id}`,
        jsonRequest("PUT", { name })
    )
    return response.json()
}

export async function deleteWorkout(id) {
    await request(`/api/workouts/${id}`, { method: "DELETE" })
}

export async function getProgress(exerciseId) {
    return (await request(`/api/exercises/${exerciseId}/progress`)).json()
}

export async function getProfile() {
    return (await request("/api/profile")).json()
}

export async function saveProfile(weightKg, heightCm) {
    const response = await request(
        "/api/profile",
        jsonRequest("PUT", { weightKg, heightCm })
    )
    return response.json()
}

export async function savePhoto(photo) {
    await request("/api/profile/photo", jsonRequest("PUT", { photo }))
}