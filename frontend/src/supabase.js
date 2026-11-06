import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
    throw new Error(
        "Липсват VITE_SUPABASE_URL или VITE_SUPABASE_PUBLISHABLE_KEY във frontend/.env"
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
            return "Грешен имейл или парола."
        case "user_already_exists":
            return "Вече има акаунт с този имейл."
        case "weak_password":
            return "Паролата е твърде слаба. Опитай по-дълга."
        case "email_not_confirmed":
            return "Потвърди имейла си чрез връзката, която ти изпратихме."
        case "email_address_invalid":
            return "Имейл адресът не е валиден."
        case "over_request_rate_limit":
        case "over_email_send_rate_limit":
            return "Твърде много опити. Изчакай малко и опитай пак."
        case "signup_disabled":
            return "Регистрацията в момента е изключена."
        default:
            return "Нещо се обърка. Провери връзката и опитай пак."
    }
}