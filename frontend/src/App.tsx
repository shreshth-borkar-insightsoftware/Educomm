import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import KitsPage from "./pages/KitsPage";
import CartPage from "./pages/CartPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import LoginPage from "./pages/LoginPages"; 
import MyCoursesPage from "./pages/MyCoursesPage"; 
import CoursesPage from "./pages/CoursesPage";
import AddressPage from "./pages/AddressPage";
import KitDetailsPage from "./pages/KitDetailsPage";

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
        </Route>
        <Route path="*" element={<div className="text-white bg-black h-screen flex items-center justify-center">404 - Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;