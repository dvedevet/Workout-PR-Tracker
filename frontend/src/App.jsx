import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

import ExerciseList from "./components/ExerciseList"

function App() {
  return (
    <div>
      <h1>Дневник за тренировки</h1>
      <ExerciseList />
    </div>
  )
}

export default App