import { Navigate, Route, Routes } from 'react-router-dom'
import CalendarPage from './pages/CalendarPage'
import HomePage from './App'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
