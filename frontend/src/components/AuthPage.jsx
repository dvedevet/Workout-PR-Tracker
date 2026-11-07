import { useState } from "react"
import { LogIn, UserPlus, Eye, EyeOff } from "lucide-react"
import { supabase, signUpClient, authMessage } from "../supabase"
import ErrorMessage from "./ErrorMessage"

function AuthPage() {
    const [mode, setMode] = useState("login")
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isBusy, setIsBusy] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [showPassword, setShowPassword] = useState(false)

    const isRegister = mode === "register"
    const cleanName = name.trim().replace(/\s+/g, " ")
    const passwordOk =
        password.length >= 8 &&
        /[a-z]/.test(password) &&
        /[A-Z]/.test(password) &&
        /\d/.test(password)
    const canSubmit =
        email.trim() !== "" &&
        (isRegister ? passwordOk : password.length >= 8) &&
        (!isRegister || cleanName !== "") &&
        !isBusy

    function clearForm() {
        setName("")
        setEmail("")
        setPassword("")
    }

    function switchMode() {
        setMode(isRegister ? "login" : "register")
        clearForm()
        setError(null)
        setSuccess(null)
    }

    async function handleRegister() {
        const { data, error: signUpError } = await signUpClient.auth.signUp({
            email: email.trim(),
            password,
            options: {
                data: { full_name: cleanName },
                emailRedirectTo: window.location.origin,
            },
        })

        if (signUpError) {
            setError(authMessage(signUpError))
            return
        }

        if (data.user && data.user.identities && data.user.identities.length === 0) {
            setError(authMessage({ code: "user_already_exists" }))
            return
        }

        clearForm()
        setMode("login")
        setSuccess(
            data.session
                ? "Регистрацията е успешна!"
                : "Регистрацията е успешна! Потвърди своя имейл чрез писмото, което ти изпратихме.")
    }

    async function handleLogin() {
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        })
        if (signInError) setError(authMessage(signInError))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!canSubmit) return

        setIsBusy(true)
        setError(null)
        setSuccess(null)
        try {
            if (isRegister) {
                await handleRegister()
            } else {
                await handleLogin()
            }
        } catch {
            setError(authMessage(null))
        } finally {
            setIsBusy(false)
        }
    }

    const inputClass =
        "w-full rounded-xl border border-sky-200 bg-white/80 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-sky-300"
    const labelClass = "mb-1 block text-sm font-medium text-sky-800"

    return (
        <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
            <h1 className="mb-8 text-center text-4xl font-bold text-sky-900">
                Дневник за тренировки
            </h1>

            <form
                onSubmit={handleSubmit}
                className="rounded-3xl border border-white/60 bg-white/60 p-8 shadow-lg backdrop-blur-md"
            >
                <h2 className="mb-6 text-center text-2xl font-bold text-sky-900">
                    {isRegister ? "Регистрация" : "Вход"}
                </h2>

                {success && (
                    <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
                        {success}
                    </p>
                )}

                {isRegister && (
                    <>
                        <label className={labelClass} htmlFor="name">
                            Име
                        </label>
                        <input
                            id="name"
                            type="text"
                            autoComplete="name"
                            maxLength={40}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={`${inputClass} mb-4`}
                        />
                    </>
                )}

                <label className={labelClass} htmlFor="email">
                    Имейл
                </label>
                <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${inputClass} mb-4`}
                />

                <label className={labelClass} htmlFor="password">
                    Парола
                </label>
                <div className="relative">
                    <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete={isRegister ? "new-password" : "current-password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${inputClass} pr-12`}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Скрий паролата" : "Покажи паролата"}
                        className="absolute inset-y-0 right-3 flex items-center text-sky-700 hover:text-sky-900"
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
                {isRegister && (
                    <p className="mt-1 text-xs text-slate-500">
                        Поне 8 символа, една главна буква, една малка буква и цифра.
                    </p>
                )}

                <ErrorMessage className="mt-4">{error}</ErrorMessage>

                <button
                    type="submit"
                    disabled={!canSubmit}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 text-base font-medium text-white shadow transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isRegister ? <UserPlus size={20} /> : <LogIn size={20} />}
                    {isBusy ? "Моля, изчакай..." : isRegister ? "Регистрирай се" : "Влез"}
                </button>
            </form>

            <button
                onClick={switchMode}
                className="mt-5 text-center text-sm text-sky-700 underline-offset-2 hover:underline"
            >
                {isRegister
                    ? "Вече имаш акаунт? Влез"
                    : "Нямаш акаунт? Регистрирай се"}
            </button>
        </div>
    )
}

export default AuthPage