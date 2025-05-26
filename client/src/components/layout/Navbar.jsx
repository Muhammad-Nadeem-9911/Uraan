import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Navbar.css'; // Assuming you have this CSS file for styling

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => !!localStorage.getItem('adminToken'));

  useEffect(() => {
    const checkAuthStatus = () => {
      const tokenExists = !!localStorage.getItem('adminToken');
      setIsAdminLoggedIn(tokenExists);
    };

    checkAuthStatus();
    window.addEventListener('storage', checkAuthStatus);
    window.addEventListener('authChanged', checkAuthStatus);

    return () => {
      window.removeEventListener('storage', checkAuthStatus);
      window.removeEventListener('authChanged', checkAuthStatus);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.dispatchEvent(new Event('authChanged'));
    toast.info('You have been logged out.');
    navigate('/admin/login');
  };

  const isProtectedAdminPage = location.pathname.startsWith('/admin/') && location.pathname !== '/admin/login';

  if (isAdminLoggedIn && isProtectedAdminPage) {
    return null; // This Navbar does not render on protected admin pages when admin is logged in
  }

  const siteName = "Uraan"; // Updated site name

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="navbar-logo">{siteName}</Link>
      </div>
      <ul className="navbar-links">
        {isAdminLoggedIn ? (
          // Admin is logged in (and on a public page or /admin/login page)
          <>
            <li>
              <NavLink
                to="/admin/dashboard"
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                Admin Dashboard
              </NavLink>
            </li>
            <li>
              <button onClick={handleLogout} className="nav-button logout-button">
                Logout
              </button>
            </li>
          </>
        ) : (
          // Not logged in as admin
          <>
            {location.pathname !== '/admin/login' && ( // Don't show login button if already on login page
              <li>
                <NavLink
                  to="/admin/login"
                  className={({ isActive }) => isActive ? 'nav-link active login-button' : 'nav-link login-button'}
                >
                  Admin Login
                </NavLink>
              </li>
            )}
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;