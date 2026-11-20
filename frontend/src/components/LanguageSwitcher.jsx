import { LANGUAGES, useLanguage } from "../i18n"

function LanguageSwitcher({ className = "" }) {
    const { lang, setLang } = useLanguage()

    return (
        <div className={`inline-flex rounded-full bg-white/70 p-1 shadow-sm ${className}`}>
            {LANGUAGES.map((item) => (
                <button
                    key={item.code}
                    type="button"
                    onClick={() => setLang(item.code)}
                    aria-pressed={lang === item.code}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${lang === item.code
                        ? "bg-sky-500 text-white shadow"
                        : "text-sky-700 hover:bg-sky-100"
                        }`}
                >
                    {item.label}
                </button>
            ))}
        </div>
    )
}

export default LanguageSwitcher
