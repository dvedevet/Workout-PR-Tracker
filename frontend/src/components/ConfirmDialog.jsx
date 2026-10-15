import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { AlertTriangle } from "lucide-react"

function ConfirmDialog({
    title,
    message,
    confirmLabel = "Потвърди",
    cancelLabel = "Отказ",
    isBusy = false,
    error = null,
    onConfirm,
    onCancel,
}) {
    const cancelRef = useRef(null)

    // При отваряне фокусът е върху "Отказ", за да не се изтрие случайно с Enter
    useEffect(() => {
        cancelRef.current?.focus()
    }, [])

    // Esc затваря диалога
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === "Escape") onCancel()
        }
        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [onCancel])

    // Рисуваме директно в <body>, за да не го хваща ефектът за размазване на картите
    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
            onClick={onCancel}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-3xl border border-white/60 bg-white p-6 shadow-2xl"
            >
                <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500">
                        <AlertTriangle size={20} />
                    </span>
                    <div>
                        <h3 id="confirm-title" className="font-bold text-sky-900">
                            {title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">{message}</p>
                    </div>
                </div>

                {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

                <div className="mt-5 flex justify-end gap-2">
                    <button
                        ref={cancelRef}
                        onClick={onCancel}
                        disabled={isBusy}
                        className="rounded-xl bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-100 disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isBusy}
                        className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isBusy ? "Изтриване..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}

export default ConfirmDialog