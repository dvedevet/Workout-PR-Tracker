import { Dumbbell, Check } from "lucide-react"

function ExerciseCard({ name, muscleGroups, isSelected, onSelect }) {
    return (
        <button
            onClick={onSelect}
            className={`flex items-center gap-3 rounded-2xl border p-4 text-left shadow-sm transition ${isSelected
                ? "border-sky-400 bg-sky-100 shadow-md"
                : "border-white/60 bg-white/70 hover:bg-sky-50"
                }`}
        >
            <div className="rounded-xl bg-sky-500 p-2 text-white">
                {isSelected ? <Check size={20} /> : <Dumbbell size={20} />}
            </div>
            <div>
                <h3 className="font-semibold text-slate-800">{name}</h3>
                <p className="text-sm text-sky-600">{muscleGroups.join(" · ")}</p>
            </div>
        </button>
    )
}

export default ExerciseCard