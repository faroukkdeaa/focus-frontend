import { Navigate } from 'react-router-dom';

/**
 * RoleGuard: Wrapper component to protect routes based on user role.
 * Assumes the user object is stored in localStorage.
 * If the user's role is not included in allowedRoles, it redirects to the dashboard.
 */
const RoleGuard = ({ children, allowedRoles }) => {
  let userRole = null;

  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      userRole = user?.role;
    }
  } catch (error) {
    console.error('Error parsing user data for RoleGuard:', error);
  }

  // If the user's role is not in the allowed list, redirect to a safe route
  if (!userRole || !allowedRoles.includes(userRole)) {
    // If the user is missing a role entirely, maybe they shouldn't even be here.
    // Assuming ProtectedRoute/ProtectedLayout handles token verification, 
    // sending them to '/dashboard' is safe (or '/' if dashboard is also restricted).
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RoleGuard;
