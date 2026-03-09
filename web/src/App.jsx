import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  )
}
