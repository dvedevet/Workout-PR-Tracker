import { useMemo, useState } from "react"
import { I18nContext, getLanguage, setLanguage, t } from "./index"

function I18nProvider({ children }) {
    const [lang, setLang] = useState(getLanguage)

    const value = useMemo(
        () => ({
            t: (key, params) => t(key, params),
            lang,
            setLang: (code) => {
                setLanguage(code)
                setLang(code)
            },
        }),
        [lang]
    )

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export default I18nProvider
