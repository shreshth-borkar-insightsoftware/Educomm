import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

const ProtectedAdminRoute = () => {
  const { user, isAuthenticated } = useAuthStore();

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has Admin role
  if (user.role !== "Admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated and is an Admin, render child routes
  return <Outlet />;
};

export default ProtectedAdminRoute;
