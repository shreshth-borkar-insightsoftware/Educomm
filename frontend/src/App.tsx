import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import AdminLayout from "./layout/AdminLayout";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import DashboardPage from "./pages/DashboardPage";
import KitsPage from "./pages/KitsPage";
import CartPage from "./pages/CartPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import LoginPage from "./pages/LoginPages"; 
import MyCoursesPage from "./pages/MyCoursesPage"; 
import CoursesPage from "./pages/CoursesPage";
import AddressPage from "./pages/AddressPage";
import KitDetailsPage from "./pages/KitDetailsPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminKits from "./pages/admin/AdminKits";
import AdminEnrollments from "./pages/admin/AdminEnrollments";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/login" element={<LoginPage />} />

        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/kits" element={<KitsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/my-orders" element={<MyOrdersPage />} />
          <Route path="/my-courses" element={<MyCoursesPage />} />
          <Route path="/courses" element={<CoursesPage/>} />
          <Route path="/address" element={<AddressPage/>} />
          <Route path="/courses" element={<KitDetailsPage />} />
          <Route path="/kits/:id" element={<KitDetailsPage />} />
          
          {/* Payment Routes - Protected for logged-in users */}
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<ProtectedAdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route path="/admin/kits" element={<AdminKits />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/enrollments" element={<AdminEnrollments />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
        </Route>

        <Route path="*" element={<div className="text-white bg-black h-screen flex items-center justify-center">404 - Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;