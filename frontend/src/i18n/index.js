import { createContext, useContext } from "react"
import en from "./en"

const dictionaries = { en }
const language = "en"

function lookup(key) {
    return dictionaries[language][key] ?? en[key] ?? key
}

export function t(key, params) {
    let text = lookup(key)

    if (params && params.count !== undefined) {
        const pluralKey = `${key}_${params.count === 1 ? "one" : "other"}`
        text = lookup(pluralKey) === pluralKey ? text : lookup(pluralKey)
    }

    return text.replace(/\{(\w+)\}/g, (_, name) => String(params?.[name] ?? ""))
}

export const I18nContext = createContext(t)

export function useT() {
    return useContext(I18nContext)
}

export function formatDate(isoDate, options) {
    return new Date(isoDate).toLocaleDateString(lookup("meta.locale"), options)
}

export function formatNumber(value) {
    return value.toLocaleString(lookup("meta.locale"), { maximumFractionDigits: 1 })
}
