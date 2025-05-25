import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';
import './EditParticipantPage.css'; // Import the CSS file
import { detectTextDirection } from '../utils/textDirection'; // Import text direction utility

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const EditParticipantPage = () => {
  const { competitionId, participantId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    pictureUrl: '', // To store existing URL for display
  });
  const [nameInputDirection, setNameInputDirection] = useState('ltr');
  const [competitionName, setCompetitionName] = useState('');
  const [pictureFile, setPictureFile] = useState(null); // State for new picture file
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchParticipantData = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      // Fetch competition name for context (optional, but good for UI)
      const compResponse = await axios.get(`${API_BASE_URL}/competitions/${competitionId}`);
      setCompetitionName(compResponse.data.data.name);

      // Fetch participant details
      const partResponse = await axios.get(`${API_BASE_URL}/participants/${participantId}`);
      const participantData = partResponse.data.data;

      setFormData({
        name: participantData.name || '',
        pictureUrl: participantData.pictureUrl || '',
      });
      setNameInputDirection(detectTextDirection(participantData.name || '')); // Set initial direction
    } catch (err) {
      console.error("Error fetching participant data:", err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch participant data.');
    } finally {
      setFetching(false);
    }
  }, [competitionId, participantId]);

  useEffect(() => {
    fetchParticipantData();
  }, [fetchParticipantData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'name') {
      setNameInputDirection(detectTextDirection(value));
    }
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === 'picture') {
      setPictureFile(files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Authentication error. Please log in again.');
        setLoading(false);
        navigate('/admin/login');
        return;
      }

      const submissionData = new FormData();
      submissionData.append('name', formData.name);
      // submissionData.append('existingPictureUrl', formData.pictureUrl); // Optional

      if (pictureFile) {
        submissionData.append('picture', pictureFile); // 'picture' should match backend (multer fieldname)
      }

      await axios.put(`${API_BASE_URL}/participants/${participantId}`, submissionData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Navigate back to the manage participants page for the current competition
      navigate(`/admin/competitions/${competitionId}/participants`);

    } catch (err) {
      console.error("Error updating participant:", err);
      setError(err.response?.data?.message || err.message || 'Failed to update participant.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="page-loading-message">Loading participant data...</div>;
  if (error && !formData.name && !fetching) { // Show error only if initial fetch failed and not fetching
    return <div className="page-error-message">Error: {error}</div>;
  }

  return (
    <div className="edit-participant-page">
      <div className="page-header">
        <Link to={`/admin/competitions/${competitionId}/participants`} className="back-link">
          &larr; Back to Participants for "{competitionName || 'Competition'}"
        </Link>
        <h2 dir="auto">Edit Participant: {formData.name || 'Loading...'}</h2>
        {competitionName && <p className="competition-context">Competition: {competitionName}</p>}
      </div>

      <form onSubmit={handleSubmit} className="edit-participant-form">
        <div className="form-group">
          <label htmlFor="name">Participant Name:</label>
          <input 
            type="text" 
            id="name" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            required
            style={{ direction: nameInputDirection }}
            dir={nameInputDirection}
          />
        </div>
        <div className="form-group">
          <label htmlFor="picture">New Picture (Optional):</label>
          <input 
            type="file" 
            id="picture" 
            name="picture" 
            onChange={handleFileChange} 
            accept="image/*"
          />
          {pictureFile && (
            <img 
              src={URL.createObjectURL(pictureFile)} 
              alt="New participant preview" 
              style={{maxWidth: '150px', marginTop: '10px', display: 'block'}} 
            />
          )}
          {!pictureFile && formData.pictureUrl && (
            <div style={{marginTop: '10px'}}>
              <p style={{fontSize: '0.9em', marginBottom: '5px'}}>Current Picture:</p>
              <img src={formData.pictureUrl} alt="Current participant" style={{maxWidth: '150px', display: 'block', border: '1px solid #ddd', padding: '2px'}} />
            </div>
          )}
        </div>

        {error && <div className="form-error-message">{error}</div>} {/* Show submission errors */}

        <div className="form-actions">
          <button type="submit" className="submit-button" disabled={loading || fetching}>
            {loading ? 'Updating...' : 'Update Participant'}
          </button>
          <button type="button" className="cancel-button" onClick={() => navigate(`/admin/competitions/${competitionId}/participants`)} disabled={loading || fetching}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditParticipantPage;