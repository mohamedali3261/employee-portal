import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'

import EmployeePortal from './pages/Employee/PortalPage'
import EmployeeProfile from './pages/Employee/ProfilePage'
import AdminLogin from './pages/Admin/LoginPage'
import AdminDashboard from './pages/Admin/DashboardPage'
import AdminEmployees from './pages/Admin/EmployeesPage'
import AdminEmployeeForm from './pages/Admin/EmployeeFormPage'
import AdminSections from './pages/Admin/SectionsPage'
import AdminCustomFields from './pages/Admin/CustomFieldsPage'
import AdminProfileSections from './pages/Admin/ProfileSectionsPage'
import AdminSectionFields from './pages/Admin/SectionFieldsPage'
import AdminUsers from './pages/Admin/UsersPage'
import IdleTimer from './components/common/IdleTimer'
import NotFound from './pages/Common/NotFoundPage'
import ForgotPassword from './pages/Admin/ForgotPasswordPage'

function ProtectedRoute({ children, requireAdmin = false }) {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  const user = JSON.parse(localStorage.getItem('admin') || '{}')
  if (requireAdmin && user.role === 'user') {
    return <Navigate to="/portal" replace />
  }
  return <>
    <IdleTimer />
    {children}
  </>
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Toaster
            position="bottom-right"
            gutter={12}
            containerStyle={{ margin: 8 }}
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                padding: '14px 18px',
                fontSize: '14px',
                fontWeight: 500,
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              },
              success: {
                style: {
                  background: '#10b981',
                  color: '#fff',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#10b981',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                  color: '#fff',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#ef4444',
                },
              },
            }}
          />
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<AdminLogin />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/portal" element={
              <ProtectedRoute>
                <EmployeePortal />
              </ProtectedRoute>
            } />
            <Route path="/employee/:id" element={<EmployeeProfile />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/employees"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminEmployees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/employees/new"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminEmployeeForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/employees/edit/:id"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminEmployeeForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sections"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminSections />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/custom-fields"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminCustomFields />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/profile-sections"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminProfileSections />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/section-fields"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminSectionFields />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App
