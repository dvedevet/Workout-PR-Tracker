import { createContext, useContext } from "react"
import en from "./en"
import bg from "./bg"

const dictionaries = { en, bg }
const STORAGE_KEY = "workie-language"

export const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "bg", label: "Български" },
]

function detectLanguage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved && dictionaries[saved]) return saved
    } catch {
        // storage can be blocked; fall back to the browser language
    }
    const browser = typeof navigator === "undefined" ? "" : navigator.language ?? ""
    return browser.toLowerCase().startsWith("bg") ? "bg" : "en"
}

let language = detectLanguage()
if (typeof document !== "undefined") document.documentElement.lang = language

export function getLanguage() {
    return language
}

export function setLanguage(code) {
    if (!dictionaries[code]) return
    language = code
    try {
        localStorage.setItem(STORAGE_KEY, code)
    } catch {
        // storage can be blocked; the choice just won't be remembered
    }
    if (typeof document !== "undefined") document.documentElement.lang = code
}

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

export function exerciseLabel(name) {
    return dictionaries[language][`exerciseName.${name}`] ?? name
}

export function groupLabel(group) {
    return dictionaries[language][`group.${group}`] ?? group
}

export function translateMessage(text) {
    return dictionaries[language][`msg.${text}`] ?? text
}

export const I18nContext = createContext({ t, lang: language, setLang: () => { } })

export function useT() {
    return useContext(I18nContext).t
}

export function useLanguage() {
    const { lang, setLang } = useContext(I18nContext)
    return { lang, setLang }
}

export function formatDate(isoDate, options) {
    return new Date(isoDate).toLocaleDateString(lookup("meta.locale"), options)
}

export function formatNumber(value) {
    return value.toLocaleString(lookup("meta.locale"), { maximumFractionDigits: 1 })
}
