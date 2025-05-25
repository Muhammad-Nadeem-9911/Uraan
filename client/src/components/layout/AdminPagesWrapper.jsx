import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import './AdminPagesWrapper.css'; // Import CSS for the wrapper

const AdminPagesWrapper = () => {
  return (
    <div className="admin-pages-wrapper">
      <AdminNavbar />
      <div className="admin-page-content-area">
        <Outlet /> {/* Nested admin routes will render here */}
      </div>

    </div>
  );
};

export default AdminPagesWrapper;