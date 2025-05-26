import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './AdminNavbar.css'; // Import the CSS file


const AdminNavbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.dispatchEvent(new Event('authChanged')); // Dispatch custom event
    toast.info('You have been logged out.');
    navigate('/admin/login');
  };

  return (
    <nav className="admin-navbar">
      {/* Make the brand text itself the link to the dashboard */}
      <Link to="/admin/dashboard" className="admin-navbar-brand">Admin Panel</Link> 
      <div className="admin-navbar-menu">
        {/* Removed the separate Dashboard link */}
        <Link to="/admin/hero-carousel" className="admin-navbar-link">Hero Settings</Link>
        {/* Add more admin links as needed */}
        <button onClick={handleLogout} className="admin-navbar-button">Logout</button>
      </div>
    </nav>
  );
};

export default AdminNavbar;