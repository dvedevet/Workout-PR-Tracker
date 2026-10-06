import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

import ExerciseList from "./components/ExerciseList"
import SessionBoard from "./components/SessionBoard"

function App() {
  const [selectedExercise, setSelectedExercise] = useState(null)

  return (
    <div>
      <h1>Дневник за тренировки</h1>
      <ExerciseList
        selectedExercise={selectedExercise}
        onSelect={setSelectedExercise}
      />
      <SessionBoard selectedExercise={selectedExercise} />
    </div>
  )
}

export default App