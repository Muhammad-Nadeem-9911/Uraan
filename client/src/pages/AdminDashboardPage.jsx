import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';

import './AdminDashboardPage.css'; // Import the new CSS
import { FaEdit, FaTrashAlt, FaUsers } from 'react-icons/fa'; // Import icons for actions
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AdminDashboardPage = () => {
  const [adminUser, setAdminUser] = useState(null);
  const [competitions, setCompetitions] = useState([]);
  const [loadingCompetitions, setLoadingCompetitions] = useState(true);
  const [errorCompetitions, setErrorCompetitions] = useState(null);
  const navigate = useNavigate();
  const location = useLocation(); // Get location object

  // Function to fetch competitions
  const fetchCompetitions = async () => {
      try {
        setLoadingCompetitions(true);
        const token = localStorage.getItem('adminToken');
        // Note: The GET /api/competitions endpoint is currently public.
        // If it were protected, we'd need to send the token in headers.
        const response = await axios.get(`${API_BASE_URL}/competitions`, {
          // headers: { Authorization: `Bearer ${token}` } // Add if endpoint becomes protected
        });
        setCompetitions(response.data.data);
        setErrorCompetitions(null);
      } catch (err) {
        setErrorCompetitions(err.response?.data?.message || err.message || 'Failed to fetch competitions');
      } finally {
        setLoadingCompetitions(false);
      }
    };

  useEffect(() => {
    const storedUser = localStorage.getItem('adminUser');
    if (storedUser) {
      setAdminUser(JSON.parse(storedUser));
    }

    fetchCompetitions();
  }, []);

  useEffect(() => {
    if (location.state?.refreshCompetitions) {
      fetchCompetitions();
      // Clear the state to prevent re-fetching on subsequent renders/navigation
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]); // Depend on location.state

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const handleDeleteCompetition = async (competitionId, competitionName) => {
    if (window.confirm(`Are you sure you want to delete the competition "${competitionName}"? This action cannot be undone.`)) {
      try {
        setLoadingCompetitions(true); // Can use a more specific loading state if preferred
        const token = localStorage.getItem('adminToken');
        if (!token) {
          setErrorCompetitions('Authentication error. Please log in again.');
          navigate('/admin/login');
          return;
        }

        await axios.delete(`${API_BASE_URL}/competitions/${competitionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Refresh the list of competitions after deletion
        setCompetitions(prevCompetitions => prevCompetitions.filter(comp => comp._id !== competitionId));
        setErrorCompetitions(null);
      } catch (err) {
        setErrorCompetitions(err.response?.data?.message || err.message || 'Failed to delete competition');
      } finally {
        setLoadingCompetitions(false);
      }
    }
  };

  // Placeholder for Create Competition Form/Modal
  const handleCreateCompetitionClick = () => {
    navigate('/admin/competitions/create');
  };

  return (
    <div className="admin-dashboard-page">
      <header className="admin-dashboard-header">
        <div> {/* Group title and welcome message */}
          <h1>Admin Dashboard</h1>
          {adminUser && <p className="admin-welcome-message">Welcome, {adminUser.email}!</p>}
        </div>

      </header>

      <section className="admin-summary-cards">
        <div className="summary-card">
          <h3 className="summary-card-title">Total Competitions</h3>
          <p className="summary-card-value">{competitions.length}</p>
          <Link to="#competitions-table" className="summary-card-link">View All</Link> {/* Link to the table below */}
        </div>
        <div className="summary-card">
          <h3 className="summary-card-title">Upcoming Competitions</h3>
          <p className="summary-card-value">{competitions.filter(c => c.status === 'UPCOMING').length}</p>
          {/* <Link to="/admin/reports" className="summary-card-link">View Report</Link> */}
        </div>
      </section>

      <section className="admin-section competitions-management">
        <h2 className="admin-section-title">Manage Competitions</h2>
        <div className="admin-actions">
          <button onClick={handleCreateCompetitionClick} className="button primary-button">Create New Competition</button>
        </div>

        {loadingCompetitions && <p className="loading-message">Loading competitions...</p>}
        {errorCompetitions && <p className="error-message">Error fetching competitions: {errorCompetitions}</p>}
        
        {!loadingCompetitions && !errorCompetitions && competitions.length === 0 && (
          <p className="info-message">No competitions found. Create one!</p>
        )}

        {!loadingCompetitions && !errorCompetitions && competitions.length > 0 && (
          <div className="admin-table-container">
            <table className="admin-table competitions-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {competitions.map(comp => (
                  <tr key={comp._id}>
                    <td data-label="Name">{comp.name}</td>
                    <td data-label="Date">{new Date(comp.date).toLocaleDateString()}</td>
                    <td data-label="Status"><span className={`status-tag status-${comp.status?.toLowerCase().replace(/\s+/g, '-')}`}>{comp.status}</span></td>
                    <td data-label="Actions" className="competition-item-actions">
                      <Link to={`/admin/competitions/edit/${comp._id}`} className="action-icon-button edit-icon" title="Edit Competition">
                        <FaEdit />
                      </Link>
                      <Link to={`/admin/competitions/${comp._id}/participants`} className="action-icon-button participants-icon" title="Manage Participants">
                        <FaUsers />
                      </Link>
                      <button 
                        onClick={() => handleDeleteCompetition(comp._id, comp.name)} 
                        disabled={loadingCompetitions} 
                        className="action-icon-button delete-icon"
                        title="Delete Competition"
                      >
                        <FaTrashAlt />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboardPage;