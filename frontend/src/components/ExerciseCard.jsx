function ExerciseCard({ name, muscleGroup, isSelected, onSelect }) {
  return (
    <div
      onClick={onSelect}
      style={{
        cursor: "pointer",
        fontWeight: isSelected ? "bold" : "normal",
      }}
    >
      <h3>{isSelected ? "✓ " : ""}{name}</h3>
      <p>{muscleGroup}</p>
    </div>
  )
}

export default ExerciseCard