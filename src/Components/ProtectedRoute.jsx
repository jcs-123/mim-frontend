import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const userData = localStorage.getItem("user");

  // ❌ Not logged in → redirect to login
  if (!userData) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userData);
  const role = user?.Role?.toLowerCase();

  // 🛑 Student cannot access admin pages
  const adminOnlyRoutes = [
    "/dashboard",
    "/mess-cut-report",
    "/name-wise-report",
    "/Date-wise-report",
    "/Monthly-Attendance-report",
    "/Request-View",
    "/Request-Bulk-Aprove",
    "/Aplology-Request",
    "/holiday-select",
    "/complaint-details",
    "/student-details",
    "/present-messcut-report",
    "/attendance-report",
    "/absent-nomesscut-report",
    "/absentees-report",
    "/attendance-comparison",
  ];

  if (role === "student" && adminOnlyRoutes.includes(location.pathname)) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Allowed → show page
  return children;
};

export default ProtectedRoute;
