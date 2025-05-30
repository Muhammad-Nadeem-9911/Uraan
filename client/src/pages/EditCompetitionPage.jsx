import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import './EditCompetitionPage.css'; // Import the CSS file
import { truncateText } from '../utils/textUtils'; // Corrected import path
import { detectTextDirection } from '../utils/textDirection'; // Import the new utility

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const EditCompetitionPage = () => {
  const { id: competitionId } = useParams(); // Get competitionId from URL
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    startTime: '', // Will be combined with date for submission
    expectedPigeonsPerParticipant: '',
    coverPhotoUrl: '', // To store existing URL for display
    status: 'UPCOMING', // Default, will be fetched
  });
  const [nameInputDirection, setNameInputDirection] = useState('ltr'); // State for name input direction
  const [coverPhotoFile, setCoverPhotoFile] = useState(null); // State for new cover photo file
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true); // For initial data fetch
  const navigate = useNavigate();

  const fetchCompetitionData = useCallback(async () => {
    setFetching(true);
    setError(null); // Clear previous errors
    try {
      // const token = localStorage.getItem('adminToken'); // Not needed if GET is public
      const response = await axios.get(`${API_BASE_URL}/competitions/${competitionId}`);
      const compData = response.data.data;

      // Format date for <input type="date"> (YYYY-MM-DD)
      const dateForInput = compData.date ? new Date(compData.date).toISOString().split('T')[0] : '';

      // Format startTime for <input type="time"> (HH:MM in local time)
      let timeForInput = '';
      if (compData.startTime) {
        const localDateTime = new Date(compData.startTime); // Converts UTC from DB to browser's local time
        const hours = String(localDateTime.getHours()).padStart(2, '0');
        const minutes = String(localDateTime.getMinutes()).padStart(2, '0');
        timeForInput = `${hours}:${minutes}`;
      }

      setFormData({
        name: compData.name || '',
        date: dateForInput,
        location: compData.location || '',
        startTime: timeForInput,
        expectedPigeonsPerParticipant: compData.expectedPigeonsPerParticipant || '',
        coverPhotoUrl: compData.coverPhotoUrl || '',
        status: compData.status || 'UPCOMING',
      });
    } catch (err) {
      console.error("Error fetching competition data:", err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch competition data.');
    } finally {
      setFetching(false);
    }
  }, [competitionId]);

  useEffect(() => {

    if (competitionId) {
      fetchCompetitionData();
    }
  }, [competitionId]);

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
    if (name === 'coverPhoto') {
      setCoverPhotoFile(files[0]);
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

      // Construct startTime by combining the selected date and time from form.
      // These form values represent local date and time.
      let competitionStartTimeISO = null;
      if (formData.date && formData.startTime) {
        const [hours, minutes] = formData.startTime.split(':');
        const localDateTime = new Date(formData.date); // Creates date at 00:00:00 local time
        localDateTime.setHours(parseInt(hours, 10));
        localDateTime.setMinutes(parseInt(minutes, 10));
        localDateTime.setSeconds(0, 0); // Ensure seconds and milliseconds are zeroed for consistency
        competitionStartTimeISO = localDateTime.toISOString(); // Converts local Date object to UTC ISO string
      }

      const submissionData = new FormData();
      submissionData.append('name', formData.name);
      if (formData.date) {
        submissionData.append('date', new Date(formData.date).toISOString());
      }
      submissionData.append('location', formData.location);
      if (competitionStartTimeISO) {
        submissionData.append('startTime', competitionStartTimeISO);
      }
      submissionData.append('expectedPigeonsPerParticipant', parseInt(formData.expectedPigeonsPerParticipant, 10));
      submissionData.append('status', formData.status);
      // submissionData.append('existingCoverPhotoUrl', formData.coverPhotoUrl); // Optionally send existing URL if backend needs it

      if (coverPhotoFile) {
        submissionData.append('coverPhoto', coverPhotoFile); // 'coverPhoto' should match backend (multer fieldname)
      }

      await axios.put(`${API_BASE_URL}/competitions/${competitionId}`, submissionData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success('Competition updated successfully!');
      navigate('/admin/dashboard', { state: { refreshCompetitions: true } }); // Navigate back and signal refresh

    } catch (err) {
      console.error("Error updating competition:", err);
      toast.error(err.response?.data?.message || err.message || 'Failed to update competition.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="page-loading-message">Loading competition data...</div>;
  if (error && !formData.name && !fetching) { // Show error only if initial fetch failed and not fetching
    return <div className="page-error-message">Error: {error}</div>;
  }

  return (
    <div className="edit-competition-page">
      <h2>Edit Competition: {formData.name ? truncateText(formData.name, 40) : 'Loading...'}</h2>
      <form onSubmit={handleSubmit} className="edit-competition-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              maxLength={60} // Add maxLength
              required
              style={{ direction: nameInputDirection }} // Apply dynamic direction
              dir={nameInputDirection} // Add dir attribute for accessibility and browser handling
            />
            {formData.name.length > 50 && <small style={{ color: 'var(--text-color-secondary)', fontSize: '0.8em' }}>{formData.name.length}/60 chars</small>}
          </div>
          <div className="form-group">
            <label htmlFor="date">Date:</label>
            <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startTime">Start Time (HH:MM):</label>
            <input type="time" id="startTime" name="startTime" value={formData.startTime} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="location">Location:</label>
            <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="expectedPigeonsPerParticipant">Pigeons per Participant:</label>
            <input type="number" id="expectedPigeonsPerParticipant" name="expectedPigeonsPerParticipant" value={formData.expectedPigeonsPerParticipant} onChange={handleChange} min="1" required />
          </div>
          <div className="form-group"> {/* Status field moved here, no longer full-width */}
            <label htmlFor="status">Status:</label>
            <select id="status" name="status" value={formData.status} onChange={handleChange} required>
              <option value="UPCOMING">Upcoming</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group full-width"> {/* Cover Photo field now full-width */}
            <label htmlFor="coverPhoto">New Cover Photo (Optional):</label>
            <input
              type="file" 
              id="coverPhoto" 
              name="coverPhoto" 
              onChange={handleFileChange} 
              accept="image/*"
            />
            {coverPhotoFile && <img src={URL.createObjectURL(coverPhotoFile)} alt="New cover preview" style={{maxWidth: '150px', marginTop: '10px', display: 'block'}} />}
            {!coverPhotoFile && formData.coverPhotoUrl && (
              <div style={{marginTop: '10px'}}>
                <p style={{fontSize: '0.9em', marginBottom: '5px'}}>Current Cover Photo:</p>
                <img src={formData.coverPhotoUrl} alt="Current cover" style={{maxWidth: '150px', display: 'block', border: '1px solid #ddd', padding: '2px'}} />
              </div>
            )}
          </div>
        </div>

        {error && <div className="form-error-message">{error}</div>} {/* Show submission errors */}

        <div className="form-actions">
          <button type="submit" className="submit-button" disabled={loading || fetching}>
            {loading ? 'Updating...' : 'Update Competition'}
          </button>
          <button
            type="button"
            className="cancel-button"
            onClick={() => navigate('/admin/dashboard')}
            disabled={loading || fetching}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCompetitionPage;