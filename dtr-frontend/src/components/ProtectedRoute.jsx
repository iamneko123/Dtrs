import { Navigate, useLocation } from 'react-router-dom';

export default function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  const location = useLocation();

  // No token? Redirect to login page
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Token exists but role mismatch? Redirect to login page
  if (role && role !== userRole) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
