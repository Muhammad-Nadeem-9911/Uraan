import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('adminToken');
  const userString = localStorage.getItem('adminUser');
  let isAdmin = false;

  if (userString) {
    try {
      const user = JSON.parse(userString);
      isAdmin = user && user.isAdmin;
    } catch (error) {
      console.error("Error parsing adminUser from localStorage:", error);
      // Potentially clear localStorage if data is corrupted
      // localStorage.removeItem('adminUser');
      // localStorage.removeItem('adminToken');
    }
  }

  // If there's a token AND the user is an admin, allow access to the route's element (via <Outlet />)
  // Otherwise, redirect to the admin login page
  return token && isAdmin ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

export default ProtectedRoute;