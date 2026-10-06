import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

import ExerciseList from "./components/ExerciseList"
import SessionBoard from "./components/SessionBoard"

function App() {
  return (
    <div>
      <h1>Дневник за тренировки</h1>
      <ExerciseList />
      <SessionBoard />
    </div>
  )
}

export default App