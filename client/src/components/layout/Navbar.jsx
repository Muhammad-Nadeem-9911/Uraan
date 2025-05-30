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
          // Admin is logged in.
          // Show "Admin Dashboard" and "Logout" ONLY if they are on the /admin/login page.
          // On public pages, a logged-in admin will see the "Admin Login" link from the block below.
          location.pathname === '/admin/login' ? (
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
            // Admin is logged in but on a public page.
            // Fall through to the logic that shows "Admin Login" if not on /admin/login page.
            // This ensures "Admin Dashboard" & "Logout" don't show on public pages for logged-in admins.
            // The "Admin Login" link will be rendered by the next conditional block.
            null // Or explicitly render the "Admin Login" link here if preferred, but the structure below handles it.
          )
        ) : null /* Not logged in as admin, handled by the block below */}

        {/* Show "Admin Login" link if:
            1. Not on the /admin/login page itself.
            AND
            2. EITHER admin is not logged in, OR admin is logged in but on a public page (covered by isAdminLoggedIn ? null : ... above).
            This simplifies to: always show if not on /admin/login, unless admin is logged in AND on /admin/login (handled above).
        */}
        {location.pathname !== '/admin/login' && (
          <>
            {/* This link will now show for non-logged-in users on public pages,
                and for logged-in admins on public pages. */}
            <li>
              <NavLink
                to="/admin/login"
                className={({ isActive }) => isActive ? 'nav-link active login-button' : 'nav-link login-button'}
              >
                Admin Login
              </NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;