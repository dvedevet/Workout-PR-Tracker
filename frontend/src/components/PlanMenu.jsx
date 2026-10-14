import { useEffect, useRef, useState } from "react"
import { ChevronDown, ClipboardList, Plus } from "lucide-react"

function PlanMenu({ plans, activePlan, onLoad, onClear, onGoToPlans }) {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef(null)

    // Затваряне при клик извън менюто или с Esc
    useEffect(() => {
        function handlePointerDown(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }
        function handleKeyDown(e) {
            if (e.key === "Escape") setIsOpen(false)
        }
        document.addEventListener("pointerdown", handlePointerDown)
        document.addEventListener("keydown", handleKeyDown)
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [])

    function handleLoad(planId) {
        onLoad(planId)
        setIsOpen(false)
    }

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 rounded-full bg-sky-500 px-4 py-1.5 text-sm font-medium text-white shadow transition hover:bg-sky-600"
            >
                <ClipboardList size={16} />
                <span className="max-w-[9rem] truncate">
                    {activePlan ? activePlan.name : "График"}
                </span>
                <ChevronDown
                    size={16}
                    className={`transition ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            {isOpen && (
                <div className="absolute right-0 z-20 mt-2 w-64 rounded-2xl border border-white/60 bg-white/95 p-2 shadow-xl">
                    {plans.length === 0 ? (
                        <div className="p-2 text-sm text-slate-600">
                            <p>В момента няма графици.</p>
                            <button
                                onClick={() => {
                                    setIsOpen(false)
                                    onGoToPlans()
                                }}
                                className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl bg-sky-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
                            >
                                <Plus size={16} /> Добави график
                            </button>
                        </div>
                    ) : (
                        <>
                            <ul className="max-h-60 overflow-y-auto">
                                {plans.map((plan) => (
                                    <li key={plan.id}>
                                        <button
                                            onClick={() => handleLoad(plan.id)}
                                            className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-sky-100 ${activePlan?.id === plan.id
                                                ? "bg-sky-50 font-semibold text-sky-900"
                                                : "text-slate-700"
                                                }`}
                                        >
                                            <span className="truncate">{plan.name}</span>
                                            <span className="shrink-0 text-xs text-slate-400">
                                                {plan.exerciseIds.length} упр.
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            {activePlan && (
                                <button
                                    onClick={() => {
                                        onClear()
                                        setIsOpen(false)
                                    }}
                                    className="mt-1 w-full rounded-xl border-t border-sky-100 px-3 py-2 text-left text-sm text-slate-500 transition hover:bg-sky-50"
                                >
                                    Без график
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

export default PlanMenu