import { createClient } from "@supabase/supabase-js"
import { t } from "./i18n"

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
    throw new Error(
        "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in frontend/.env"
    )
}

export const supabase = createClient(url, key)

export const signUpClient = createClient(url, key, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: "sb-signup-temp",
    },
})

export function authMessage(error) {
    switch (error?.code) {
        case "invalid_credentials":
            return t("auth.invalidCredentials")
        case "user_already_exists":
            return t("auth.userExists")
        case "weak_password":
            return t("auth.weakPassword")
        case "email_not_confirmed":
            return t("auth.emailNotConfirmed")
        case "email_address_invalid":
            return t("auth.invalidEmail")
        case "over_request_rate_limit":
        case "over_email_send_rate_limit":
            return t("auth.rateLimit")
        case "signup_disabled":
            return t("auth.signupDisabled")
        default:
            return t("auth.generic")
    }
}