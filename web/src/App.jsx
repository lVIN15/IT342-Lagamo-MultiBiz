import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Businesses from './pages/Businesses'
import BusinessDetail from './pages/BusinessDetail'
import Billing from './pages/Billing'
import ExportReports from './pages/ExportReports'
import './index.css'

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/businesses" 
          element={
            <ProtectedRoute>
              <Businesses />
            </ProtectedRoute>
          } 
        />
        {/* /business/:id — Business Detail & Transaction View */}
        <Route 
          path="/business/:businessId" 
          element={
            <ProtectedRoute>
              <BusinessDetail />
            </ProtectedRoute>
          } 
        />
        <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
        <Route path="/export" element={<ProtectedRoute><ExportReports /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

