import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ManageCompetitionParticipantsPage.css'; // Import the CSS file
import { truncateText } from '../utils/textUtils'; // Corrected import path
import { detectTextDirection } from '../utils/textDirection'; // Import text direction utility

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ManageCompetitionParticipantsPage = () => {
  const { competitionId } = useParams();
  const navigate = useNavigate();

  const [competition, setCompetition] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantPictureFile, setNewParticipantPictureFile] = useState(null);
  const [newParticipantNameDirection, setNewParticipantNameDirection] = useState('ltr');

  const [loadingCompetition, setLoadingCompetition] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState(true);
  const [addingParticipant, setAddingParticipant] = useState(false);

  const [error, setError] = useState(null);

  const fetchCompetitionDetails = useCallback(async () => {
    setLoadingCompetition(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/competitions/${competitionId}`);
      setCompetition(response.data.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching competition details:", err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch competition details');
    } finally {
      setLoadingCompetition(false);
    }
  }, [competitionId]);

  const fetchParticipants = useCallback(async () => {
    setLoadingParticipants(true);
    try {
      // Assuming GET /api/participants?competitionId=<id> fetches participants for a competition
      const response = await axios.get(`${API_BASE_URL}/participants?competitionId=${competitionId}`);
      setParticipants(response.data.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching participants:", err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch participants');
      setParticipants([]); // Clear participants on error
    } finally {
      setLoadingParticipants(false);
    }
  }, [competitionId]);

  useEffect(() => {
    fetchCompetitionDetails();
    fetchParticipants();
  }, [fetchCompetitionDetails, fetchParticipants]);

  const handleDeleteParticipant = async (participantIdToDelete, participantName) => {
    if (window.confirm(`Are you sure you want to remove "${participantName}" from this competition?`)) {
      setLoadingParticipants(true); // Indicate an operation is in progress
      setError(null);
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          setError('Authentication error. Please log in again.');
          navigate('/admin/login');
          return;
        }
        // API call to delete the participant
        await axios.delete(`${API_BASE_URL}/participants/${participantIdToDelete}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Refresh participant list
        fetchParticipants();
        toast.success(`"${participantName}" removed successfully.`);
      } catch (err) {
        console.error("Error deleting participant:", err);
        const errorMsg = err.response?.data?.message || err.message || 'Failed to delete participant.';
        setError(errorMsg); // Keep for potential inline display
        toast.error(errorMsg);
      } finally {
      }
    }
  };

  const handleNewParticipantNameChange = (e) => {
    const { value } = e.target;
    setNewParticipantName(value);
    setNewParticipantNameDirection(detectTextDirection(value));
  };


  const handleAddParticipantFileChange = (e) => {
    const { name, files } = e.target;
    if (name === 'newParticipantPicture') {
      setNewParticipantPictureFile(files[0]);
    }
  };

  const handleAddParticipant = async (e) => {
    e.preventDefault();
    if (!newParticipantName.trim()) {
      setError("Participant name is required.");
      return;
    }
    setAddingParticipant(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      
      const submissionData = new FormData();
      submissionData.append('name', newParticipantName);
      submissionData.append('competitionId', competitionId);

      if (newParticipantPictureFile) {
        submissionData.append('picture', newParticipantPictureFile); // 'picture' should match backend (multer fieldname)
      }

      await axios.post(`${API_BASE_URL}/participants`, submissionData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewParticipantName(''); // Clear form
      setNewParticipantPictureFile(null);
      setNewParticipantNameDirection('ltr'); // Reset direction
      toast.success('Participant added successfully!');
      fetchParticipants(); // Refresh participant list
    } catch (err) {
      console.error("Error adding participant:", err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to add participant.';
      setError(errorMsg); // Keep for potential inline display
      toast.error(errorMsg);
    } finally {
      setAddingParticipant(false);
    }
  };

  if (loadingCompetition) return <div className="page-loading-message">Loading competition details...</div>;
  if (error && !competition && !loadingCompetition) return <div className="page-error-message">Error: {error}</div>;
  if (!competition && !loadingCompetition) return <div className="page-error-message">Competition not found.</div>;

  return (
    <div className="manage-participants-page">
      <div className="page-header">
        <Link to="/admin/dashboard" className="back-link">&larr; Back to Dashboard</Link>
        <h2 dir="auto">Manage Participants for: {competition?.name ? truncateText(competition.name, 30) : 'Loading...'}</h2>
        {competition && <p className="competition-date">Date: {new Date(competition.date).toLocaleDateString()}</p>}
      </div>

      <div className="add-participant-section">
        <h3>Add New Participant</h3>
        <form onSubmit={handleAddParticipant} className="add-participant-form">
          <div className="form-group">
            <label htmlFor="newParticipantName">Name:</label>
            <input
              type="text"
              id="newParticipantName"
              value={newParticipantName}
              onChange={handleNewParticipantNameChange}
              placeholder="Enter participant's name"
              required
              style={{ direction: newParticipantNameDirection }}
              dir={newParticipantNameDirection}
            />
          </div>
          <div className="form-group">
            <label htmlFor="newParticipantPicture">Picture (Optional):</label>
            <input
              type="file"
              id="newParticipantPicture"
              name="newParticipantPicture"
              onChange={handleAddParticipantFileChange}
              accept="image/*"
            />
            {newParticipantPictureFile && (
              <img 
                src={URL.createObjectURL(newParticipantPictureFile)} 
                alt="Participant preview" 
                style={{maxWidth: '100px', marginTop: '10px'}} 
              />
            )}
          </div>
          {error && <div className="form-error-message">{error}</div>}
          <button type="submit" className="submit-button" disabled={addingParticipant}>
            {addingParticipant ? 'Adding...' : 'Add Participant'}
          </button>
        </form>
      </div>

      <hr className="section-divider" />

      <div className="current-participants-section">
        <h3>Current Participants ({participants.length})</h3>
        {loadingParticipants ? <div className="page-loading-message">Loading participants...</div> : (
          participants.length === 0 ? <p>No participants added yet.</p> : (
            <ul className="participants-list">
              {participants.map(p => (
                <li key={p._id} className="participant-item">
                  <span className="participant-name" dir="auto">{p.name}</span>
                  <div className="actions">
                    <Link
                      to={`/admin/competitions/${competitionId}/participants/${p._id}/edit`}
                      className="action-link edit-link"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteParticipant(p._id, p.name)}
                      className="action-button delete-button"
                      disabled={loadingParticipants || addingParticipant}
                    >
                      Delete
                    </button>
                    <Link
                      to={`/admin/competitions/${competitionId}/participants/${p._id}/record-times`}
                      className="action-link record-times-link"
                    >
                      Record Times
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}
        {error && !loadingParticipants && <div className="page-error-message-inline" style={{marginTop: '1rem'}}>{error}</div> /* Show error if participant loading failed */}
        </div>
    </div>
  );
};

export default ManageCompetitionParticipantsPage;