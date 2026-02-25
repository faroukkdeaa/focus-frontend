import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute: Wrapper component to protect routes that require authentication.
 * Checks for token in localStorage. If missing, redirects to /login.
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    // Redirect to login and replace history entry to prevent back navigation
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
