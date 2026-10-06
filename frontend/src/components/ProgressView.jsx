import { useState } from "react"
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
import { getExerciseProgress } from "../utils/stats"

const metrics = [
    { id: "oneRM", label: "Прогнозен 1RM" },
    { id: "maxReps", label: "Макс. повторения" },
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
            {metric === "oneRM" ? (
                <p className="text-sky-700">Прогнозен 1RM: {point.oneRM} кг</p>
            ) : (
                <p className="text-sky-700">
                    {point.maxReps} повт.{" "}
                    {point.repsWeight > 0 ? `/ ${point.repsWeight} кг.` : "без тежест"}
                </p>
            )}
        </div>
    )
}

function ProgressView({ history }) {
    const [selectedId, setSelectedId] = useState(null)
    const [metric, setMetric] = useState("oneRM")

    const trained = []
    history.forEach((workout) => {
        workout.exercises.forEach((exercise) => {
            if (!trained.some((item) => item.exerciseId === exercise.exerciseId)) {
                trained.push({ exerciseId: exercise.exerciseId, name: exercise.name })
            }
        })
    })

    if (trained.length === 0) {
        return (
            <section className="rounded-3xl border border-white/60 bg-white/60 p-6 text-sky-700 shadow-lg backdrop-blur-md">
                Още няма записани тренировки. Завърши една, за да видиш прогреса си.
            </section>
        )
    }

    const activeId = selectedId ?? trained[0].exerciseId
    const points = getExerciseProgress(history, activeId)
    const chartData = points.map((point) => ({
        ...point,
        label: shortDate(point.date),
    }))
    const activeMetric = metrics.find((item) => item.id === metric)

    const bestOneRM = Math.max(...points.map((point) => point.oneRM))
    const maxWeight = Math.max(...points.map((point) => point.maxWeight))

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
                изчислена по формулата на Epley: тежест × (1 + повторения / 30).
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

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={chartData}
                        margin={{ top: 8, right: 12, bottom: 0, left: -12 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#bae6fd" />
                        <XAxis dataKey="label" stroke="#0284c7" fontSize={12} />
                        <YAxis stroke="#0284c7" fontSize={12} />
                        <Tooltip content={<ChartTooltip metric={metric} />} />
                        <Line
                            type="monotone"
                            dataKey={metric}
                            name={activeMetric.label}
                            stroke="#0ea5e9"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </section>
    )
}

export default ProgressView