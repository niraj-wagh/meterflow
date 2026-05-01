import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useSocket } from './hooks/useSocket'

// Auth pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Admin pages
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminUsage from './pages/admin/AdminUsage'
import AdminAuditLogs from './pages/admin/AdminAuditLogs'

// Customer pages
import CustomerLayout from './pages/customer/CustomerLayout'
import CustomerDashboard from './pages/customer/CustomerDashboard'
import MyApis from './pages/customer/MyApis'
import ApiKeys from './pages/customer/ApiKeys'
import UsageLogs from './pages/customer/UsageLogs'
import Billing from './pages/customer/Billing'
import Analytics from './pages/customer/Analytics'
import Playground from './pages/customer/Playground'
import Webhooks from './pages/customer/Webhooks'
import Settings from './pages/customer/Settings'

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore()
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }
  return children
}

export default function App() {
  useSocket()

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="usage" element={<AdminUsage />} />
        <Route path="audit" element={<AdminAuditLogs />} />
      </Route>

      {/* Customer */}
      <Route path="/dashboard" element={<ProtectedRoute><CustomerLayout /></ProtectedRoute>}>
        <Route index element={<CustomerDashboard />} />
        <Route path="apis" element={<MyApis />} />
        <Route path="keys" element={<ApiKeys />} />
        <Route path="usage" element={<UsageLogs />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="billing" element={<Billing />} />
        <Route path="playground" element={<Playground />} />
        <Route path="webhooks" element={<Webhooks />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
