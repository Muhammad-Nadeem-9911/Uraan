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
      <Link to="/admin/dashboard" className="admin-navbar-brand">Admin Panel</Link>
      <div className="admin-navbar-menu">
        <Link to="/admin/dashboard" className="admin-navbar-link">Dashboard</Link>
        <Link to="/admin/hero-carousel" className="admin-navbar-link">Manage Hero Carousel</Link>

        {/* Add more admin links as needed */}
        <button onClick={handleLogout} className="admin-navbar-button">Logout</button>
      </div>
    </nav>
  );
};

export default AdminNavbar;