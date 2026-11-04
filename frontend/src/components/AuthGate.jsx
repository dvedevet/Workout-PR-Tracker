import { useEffect, useState } from "react"
import { LogOut } from "lucide-react"
import { supabase } from "../supabase"
import AuthPage from "./AuthPage"

// "Врата" пред приложението: без сесия се вижда само екранът за вход
function AuthGate({ children }) {
    // undefined = още проверяваме, null = няма сесия, обект = влязъл е
    const [session, setSession] = useState(undefined)

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setSession(data.session))

        // Реагира на вход, изход и подновяване на токена
        const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession)
        })

        return () => data.subscription.unsubscribe()
    }, [])

    if (session === undefined) {
        return (
            <p className="py-20 text-center text-sm text-sky-600">Зареждане...</p>
        )
    }

    if (session === null) {
        return <AuthPage />
    }

    return (
        <>
            <div className="mx-auto flex max-w-5xl items-center justify-end gap-3 px-4 pt-4 text-sm">
                <span className="truncate text-slate-500">{session.user.email}</span>
                <button
                    onClick={() => supabase.auth.signOut()}
                    className="flex shrink-0 items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 font-medium text-sky-700 transition hover:bg-sky-100"
                >
                    <LogOut size={16} /> Изход
                </button>
            </div>
            {children}
        </>
    )
}

export default AuthGate