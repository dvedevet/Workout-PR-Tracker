import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts"
import { getProgress, userMessage } from "../api"

const metrics = [
    { id: "oneRM", label: "Прогнозен 1RM" },
    { id: "maxWeight", label: "Макс. тежест" },
]

function shortDate(isoDate) {
    return new Date(isoDate).toLocaleDateString("bg-BG", {
        day: "numeric",
        month: "short",
    })
}

function ChartTooltip({ active, payload, metric }) {
    if (!active || !payload || payload.length === 0) return null
    const point = payload[0].payload

    return (
        <div className="rounded-xl border border-sky-100 bg-white/95 px-3 py-2 text-sm shadow-lg">
            <p className="font-semibold text-sky-900">{point.label}</p>
            {metric === "oneRM" && (
                <p className="text-sky-700">Прогнозен 1RM: {point.oneRM} кг.</p>
            )}
            {metric === "maxWeight" && (
                <p className="text-sky-700">
                    Тежест: {point.maxWeight} кг. | Повторения: {point.maxWeightReps}
                </p>
            )}
            {metric === "maxReps" && (
                <p className="text-sky-700">Повторения: {point.maxReps}</p>
            )}
        </div>
    )
}

function ProgressChart({ data, dataKey, name }) {
    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{ top: 8, right: 12, bottom: 0, left: -12 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#bae6fd" />
                    <XAxis dataKey="label" stroke="#0284c7" fontSize={12} />
                    <YAxis
                        stroke="#0284c7"
                        fontSize={12}
                        allowDecimals={dataKey !== "maxReps"}
                    />
                    <Tooltip content={<ChartTooltip metric={dataKey} />} />
                    <Line
                        type="monotone"
                        dataKey={dataKey}
                        name={name}
                        stroke="#0ea5e9"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

function ProgressView({ history }) {
    const [selectedId, setSelectedId] = useState(null)
    const [metric, setMetric] = useState("oneRM")
    const [result, setResult] = useState(null) // { exerciseId, points }
    const [error, setError] = useState(null)

    // Кои упражнения са тренирани (от историята)
    const trained = []
    history.forEach((workout) => {
        workout.exercises.forEach((exercise) => {
            if (!trained.some((item) => item.exerciseId === exercise.exerciseId)) {
                trained.push({ exerciseId: exercise.exerciseId, name: exercise.name })
            }
        })
    })

    // Ако избраното вече го няма в историята (изтрита тренировка), взимаме първото
    const activeId = trained.some((item) => item.exerciseId === selectedId)
        ? selectedId
        : (trained[0]?.exerciseId ?? null)

    // Точките идват от API-то; при смяна на упражнението или историята се теглят наново
    useEffect(() => {
        if (activeId === null) return

        let cancelled = false
        getProgress(activeId)
            .then((points) => {
                if (cancelled) return
                setResult({ exerciseId: activeId, points })
                setError(null)
            })
            .catch((err) => {
                if (!cancelled) setError(userMessage(err))
            })

        // Ако потребителят смени упражнението, преди отговорът да дойде,
        // старият отговор се игнорира
        return () => {
            cancelled = true
        }
    }, [activeId, history])

    if (trained.length === 0) {
        return (
            <section className="rounded-3xl border border-white/60 bg-white/60 p-6 text-sky-700 shadow-lg backdrop-blur-md">
                Още няма записани тренировки. Завърши тренировка, за да можеш да следиш прогреса си.
            </section>
        )
    }

    const points =
        result && result.exerciseId === activeId ? result.points : null
    const chartData = (points ?? []).map((point) => ({
        ...point,
        label: shortDate(point.date),
    }))
    const hasWeight = chartData.some((point) => point.maxWeight > 0)
    const activeMetric = metrics.find((item) => item.id === metric)

    const bestOneRM = Math.max(...chartData.map((point) => point.oneRM))
    const maxWeight = Math.max(...chartData.map((point) => point.maxWeight))
    const maxReps = Math.max(...chartData.map((point) => point.maxReps))

    const stats = [
        { label: "Макс. тежест", value: `${maxWeight} кг` },
        { label: "Най-добър 1RM", value: `≈ ${bestOneRM} кг` },
    ]

    return (
        <section className="rounded-3xl border border-white/60 bg-white/60 p-6 shadow-lg backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-sky-900">Прогрес</h2>
                <div className="relative">
                    <select
                        value={activeId}
                        onChange={(e) => setSelectedId(Number(e.target.value))}
                        className="w-52 appearance-none truncate rounded-xl border border-sky-200 bg-white/80 py-2 pl-3 pr-9 text-sm text-sky-800 outline-none focus:ring-2 focus:ring-sky-300"
                    >
                        {trained.map((item) => (
                            <option key={item.exerciseId} value={item.exerciseId}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown
                        size={16}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sky-500"
                    />
                </div>
            </div>

            {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

            {points === null && !error && (
                <p className="py-6 text-center text-sm text-sky-600">Зареждане...</p>
            )}

            {points !== null && points.length === 0 && (
                <p className="py-6 text-center text-sm text-sky-600">
                    Няма данни за това упражнение.
                </p>
            )}

            {points !== null && points.length > 0 && hasWeight && (
                <>
                    <div className="mb-2 grid grid-cols-2 gap-2">
                        {stats.map((stat) => (
                            <div
                                key={stat.label}
                                className="rounded-2xl bg-white/80 p-3 text-center shadow-sm"
                            >
                                <p className="text-xs text-slate-500">{stat.label}</p>
                                <p className="mt-1 font-bold text-sky-800">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    <p className="mb-4 text-xs text-slate-500">
                        <span className="font-semibold text-sky-700">1RM</span> (one-rep max) е
                        най-голямата тежест, която можеш да вдигнеш за едно повторение. Тук е
                        изчислена по формулата на Epley: <span className="font-semibold text-sky-700">тежест × (1 + повторения / 30).</span>
                    </p>

                    <div className="mb-3 flex flex-wrap gap-2">
                        {metrics.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setMetric(item.id)}
                                className={`rounded-full px-3 py-1 text-sm font-medium transition ${metric === item.id
                                    ? "bg-sky-500 text-white shadow"
                                    : "bg-white/80 text-sky-700 hover:bg-sky-100"
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <ProgressChart
                        data={chartData}
                        dataKey={metric}
                        name={activeMetric.label}
                    />
                </>
            )}

            {points !== null && points.length > 0 && !hasWeight && (
                <>
                    <div className="mb-2 rounded-2xl bg-white/80 p-3 text-center shadow-sm">
                        <p className="text-xs text-slate-500">Макс. повторения</p>
                        <p className="mt-1 font-bold text-sky-800">{maxReps} повт.</p>
                    </div>

                    <p className="mb-4 text-xs text-slate-500">
                        Упражнението е без тежест, затова следим най-многото повторения в
                        една серия от тренировка.
                    </p>

                    <ProgressChart
                        data={chartData}
                        dataKey="maxReps"
                        name="Макс. повторения"
                    />
                </>
            )}
        </section>
    )
}

export default ProgressView