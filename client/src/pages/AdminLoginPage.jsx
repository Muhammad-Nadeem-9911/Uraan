import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // Import toast
import './AdminLoginPage.css'; // Import the CSS file

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [error, setError] = useState(null); // Replaced by toast notifications
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // setError(null); // No longer needed

    try {
      const response = await axios.post(`${API_BASE_URL}/users/login`, {
        email,
        password,
      });

      // Assuming the backend sends back a token and user info
      const { token, userId, isAdmin } = response.data; // Adjust based on your backend response

      if (token && isAdmin) { // Check if user is an admin
        // Store the token (e.g., in localStorage)
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminUser', JSON.stringify({ userId, email, isAdmin })); // Store user info
        window.dispatchEvent(new Event('authChanged')); // Dispatch custom event
        toast.success('Login successful! Redirecting...'); // Optional: success toast
        // Navigate to the admin dashboard
        navigate('/admin/dashboard');
      } else if (token && !isAdmin) { // Handle case where user is valid but not admin
        toast.error('Login successful, but you are not authorized as an admin.');
      } else {
        // This case might indicate an unexpected backend response if a token was expected
        toast.error('Login failed. Invalid response from server.');
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="login-container">
        <div className="login-header">
          {/* You can replace this div with an <img> tag for your logo */}
          {/* Example: <img src="/path-to-your-logo.png" alt="Company Logo" className="login-logo" /> */}
          <div className="login-logo" aria-label="Logo placeholder">
            {/* Placeholder: You could put initials or a simple SVG here if no image */}
          </div>
          <h2>Admin Login</h2>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label> {/* Slightly more descriptive */}
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com" // Added placeholder
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password" // Added placeholder
              autoComplete="current-password"
            />
          </div>
          {/* Error message display is now handled by react-toastify */}
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;