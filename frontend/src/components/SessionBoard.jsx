import { Check } from "lucide-react"
import ExerciseBlock from "./ExerciseBlock"
import PlanMenu from "./PlanMenu"
import { getLastPerformance, getSessionPRs } from "../utils/stats"
import { MUSCLE_GROUPS } from "../data/muscleGroups"

function SessionBoard({
    exercises,
    plans,
    activePlan,
    selectedExercise,
    sets,
    history,
    isSaving,
    saveError,
    onLoadPlan,
    onClearPlan,
    onRemoveFromPlan,
    onGoToPlans,
    onAddSet,
    onDeleteSet,
    onFinish,
}) {
    const prTypes = getSessionPRs(history, sets)
    const prById = {}
    sets.forEach((set, index) => {
        prById[set.id] = prTypes[index]
    })

    // Кои упражнения се показват: от графика, после тези със серии, после избраното
    const blocks = []
    function addBlock(exercise) {
        if (!blocks.some((item) => item.id === exercise.id)) blocks.push(exercise)
    }

    const planExerciseIds = activePlan ? activePlan.exerciseIds : []

    // Реда на основната група в списъка с групи (Гърди, Гръб, Крака...)
    function groupOrder(exercise) {
        const index = MUSCLE_GROUPS.indexOf(exercise.muscleGroups[0])
        return index === -1 ? MUSCLE_GROUPS.length : index
    }

    planExerciseIds
        .map((id) => exercises.find((item) => item.id === id))
        .filter(Boolean)
        .sort((a, b) => groupOrder(a) - groupOrder(b)) // стабилно: вътре в групата остава редът от графика
        .forEach(addBlock)

    sets.forEach((set) => {
        addBlock(
            exercises.find((item) => item.id === set.exerciseId) ?? {
                id: set.exerciseId,
                name: set.exerciseName,
                muscleGroups: set.muscleGroups,
            }
        )
    })
    if (selectedExercise) addBlock(selectedExercise)

    return (
        <section className="rounded-3xl border border-white/60 bg-white/60 p-6 shadow-lg backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-sky-900">Текуща тренировка</h2>
                <PlanMenu
                    plans={plans}
                    activePlan={activePlan}
                    onLoad={onLoadPlan}
                    onClear={onClearPlan}
                    onGoToPlans={onGoToPlans}
                />
            </div>

            {activePlan && (
                <p className="mb-3 text-xs text-slate-500">
                    График „{activePlan.name}“. Промените тук важат само за тази
                    тренировка.
                </p>
            )}

            {blocks.length === 0 ? (
                <p className="text-sm text-sky-600">
                    Избери упражнение от списъка или зареди график.
                </p>
            ) : (
                <div className="grid gap-3">
                    {blocks.map((exercise) => {
                        const exerciseSets = sets.filter(
                            (set) => set.exerciseId === exercise.id
                        )
                        const canRemove =
                            exerciseSets.length === 0 &&
                            planExerciseIds.includes(exercise.id)

                        return (
                            <ExerciseBlock
                                key={exercise.id}
                                exercise={exercise}
                                sets={exerciseSets}
                                prById={prById}
                                lastTime={getLastPerformance(history, exercise.id)}
                                isSelected={selectedExercise?.id === exercise.id}
                                onAddSet={onAddSet}
                                onDeleteSet={onDeleteSet}
                                onRemove={
                                    canRemove ? () => onRemoveFromPlan(exercise.id) : null
                                }
                            />
                        )
                    })}
                </div>
            )}

            {(sets.length > 0 || activePlan) && (
                <>
                    <button
                        onClick={onFinish}
                        disabled={isSaving || sets.length === 0}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 font-medium text-white shadow transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Check size={18} />
                        {isSaving ? "Запазване..." : "Завърши тренировката"}
                    </button>
                    {sets.length === 0 && (
                        <p className="mt-2 text-center text-xs text-slate-500">
                            Добави поне една серия, за да завършиш тренировката.
                        </p>
                    )}
                    {saveError && (
                        <p className="mt-2 text-center text-sm text-red-500">{saveError}</p>
                    )}
                </>
            )}
        </section>
    )
}

export default SessionBoard 