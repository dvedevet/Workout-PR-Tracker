import { I18nContext, t } from "./index"

function I18nProvider({ children }) {
    return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>
}

export default I18nProvider
