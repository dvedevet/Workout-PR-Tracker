import { useEffect, useState } from "react"
import { supabase } from "../supabase"
import AuthPage from "./AuthPage"

function AuthGate({ children }) {
    const [session, setSession] = useState(undefined)

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setSession(data.session))

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

    return children
}

export default AuthGate