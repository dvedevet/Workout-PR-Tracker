import { CalendarDays } from "lucide-react"
import { history } from "../data/history"

function formatDate(isoDate) {
    return new Date(isoDate).toLocaleDateString("bg-BG", {
        day: "numeric",
        month: "long",
        year: "numeric",
    })
}

function HistoryView() {
    return (
        <section className="grid gap-4">
            {history.map((workout) => (
                <article
                    key={workout.id}
                    className="rounded-3xl border border-white/60 bg-white/60 p-6 shadow-lg backdrop-blur-md"
                >
                    <div className="mb-4 flex items-center gap-2">
                        <CalendarDays size={20} className="text-sky-500" />
                        <h2 className="text-lg font-bold text-sky-900">
                            {formatDate(workout.date)}
                        </h2>
                    </div>

                    <div className="grid gap-4">
                        {workout.exercises.map((exercise) => (
                            <div key={exercise.name}>
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <p className="font-semibold text-sky-800">{exercise.name}</p>
                                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                                        {exercise.muscleGroup}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 text-sm">
                                    {exercise.sets.map((set, index) => (
                                        <span
                                            key={index}
                                            className="rounded-lg bg-sky-50 px-2 py-0.5 font-medium text-sky-800"
                                        >
                                            <span className="text-slate-500">{index + 1}.</span>{" "}
                                            {set.weight} кг × {set.reps}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </article>
            ))}
        </section>
    )
}

export default HistoryView