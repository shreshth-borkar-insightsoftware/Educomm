import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useAuthStore } from "@/store/useAuthStore"
import LoginPage from "./pages/LoginPages"
import RegisterPage from "./pages/RegisterPage"
import DashboardPage from "./pages/DashboardPage"
import KitsPage from "./pages/KitsPage";
import CoursesPage from "./pages/CoursesPage";
import MyCoursesPage from "./pages/MyCoursesPage"; 
import CourseContentPage from "./pages/CourseContentPage"; 
import KitDetailsPage from "./pages/KitDetailsPage";

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/my-courses" 
          element={isAuthenticated ? <MyCoursesPage /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/courses/:id/content" 
          element={isAuthenticated ? <CourseContentPage /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/courses" 
          element={isAuthenticated ? <CoursesPage /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/kits" 
          element={isAuthenticated ? <KitsPage /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/kits/:id" 
          element={isAuthenticated ? <KitDetailsPage /> : <Navigate to="/login" />} 
        />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  )
}

export default App