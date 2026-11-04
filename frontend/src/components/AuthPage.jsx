import { useState } from "react"
import { LogIn, UserPlus } from "lucide-react"
import { supabase, authMessage } from "../supabase"

function AuthPage() {
    const [mode, setMode] = useState("login")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isBusy, setIsBusy] = useState(false)
    const [error, setError] = useState(null)
    const [info, setInfo] = useState(null)

    const isRegister = mode === "register"
    const canSubmit = email.trim() !== "" && password.length >= 8 && !isBusy

    function switchMode() {
        setMode(isRegister ? "login" : "register")
        setError(null)
        setInfo(null)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!canSubmit) return

        setIsBusy(true)
        setError(null)
        setInfo(null)

        const credentials = { email: email.trim(), password }

        if (isRegister) {
            const { data, error: signUpError } = await supabase.auth.signUp(credentials)
            if (signUpError) {
                setError(authMessage(signUpError))
            } else if (!data.session) {
                // Потвърждението на имейл е включено: още няма сесия
                setInfo("Изпратихме ти имейл. Потвърди адреса си и влез.")
                setMode("login")
            }
            // Ако има сесия, AuthGate сам ще покаже приложението
        } else {
            const { error: signInError } = await supabase.auth.signInWithPassword(credentials)
            if (signInError) setError(authMessage(signInError))
        }

        setIsBusy(false)
    }

    const inputClass =
        "w-full rounded-xl border border-sky-200 bg-white/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300"

    return (
        <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-8">
            <h1 className="mb-6 text-center text-3xl font-bold text-sky-900">
                Дневник за тренировки
            </h1>

            <form
                onSubmit={handleSubmit}
                className="rounded-3xl border border-white/60 bg-white/60 p-6 shadow-lg backdrop-blur-md"
            >
                <h2 className="mb-4 text-xl font-bold text-sky-900">
                    {isRegister ? "Регистрация" : "Вход"}
                </h2>

                <label className="mb-1 block text-sm text-sky-800" htmlFor="email">
                    Имейл
                </label>
                <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${inputClass} mb-3`}
                />

                <label className="mb-1 block text-sm text-sky-800" htmlFor="password">
                    Парола
                </label>
                <input
                    id="password"
                    type="password"
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                />
                {isRegister && (
                    <p className="mt-1 text-xs text-slate-500">Поне 8 символа.</p>
                )}

                {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
                {info && <p className="mt-3 text-sm text-sky-700">{info}</p>}

                <button
                    type="submit"
                    disabled={!canSubmit}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 font-medium text-white shadow transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
                    {isBusy ? "Моля, изчакай..." : isRegister ? "Регистрирай се" : "Влез"}
                </button>
            </form>

            <button
                onClick={switchMode}
                className="mt-4 text-center text-sm text-sky-700 underline-offset-2 hover:underline"
            >
                {isRegister
                    ? "Вече имаш акаунт? Влез"
                    : "Нямаш акаунт? Регистрирай се"}
            </button>
        </div>
    )
}

export default AuthPage