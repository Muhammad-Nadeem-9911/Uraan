import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { detectTextDirection } from '../utils/textDirection'; // Import the new utility
import './CreateCompetitionPage.css'; // Import the new CSS
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CreateCompetitionPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    startTime: '', // Will be combined with date for submission
    expectedPigeonsPerParticipant: '',
    status: 'UPCOMING', // Default status
  });
  const [nameInputDirection, setNameInputDirection] = useState('ltr'); // State for name input direction
  const [coverPhotoFile, setCoverPhotoFile] = useState(null); // State for the cover photo file
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

      if (coverPhotoFile) {
        submissionData.append('coverPhoto', coverPhotoFile); // 'coverPhoto' should match backend (multer fieldname)
      }

      await axios.post(`${API_BASE_URL}/competitions`, submissionData, {
        headers: {
          Authorization: `Bearer ${token}`,
          // 'Content-Type': 'multipart/form-data' will be set automatically by Axios for FormData
        },
      });

      // On success, navigate back to the admin dashboard
      toast.success('Competition created successfully!');
      navigate('/admin/dashboard', { state: { refreshCompetitions: true } });

    } catch (err) {
      console.error("Error creating competition:", err);
      toast.error(err.response?.data?.message || err.message || 'Failed to create competition.');
      // setError can still be used for specific inline form field errors if needed
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-competition-page">
      <h2>Create New Competition</h2>
      <form onSubmit={handleSubmit}>
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
            <label htmlFor="location">Location:</label>
            <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="startTime">Start Time (HH:MM):</label>
            <input type="time" id="startTime" name="startTime" value={formData.startTime} onChange={handleChange} required />
          </div>
        </div>

          <div className="form-row">
          <div className="form-group">
            <label htmlFor="expectedPigeonsPerParticipant">Expected Pigeons per Participant:</label>
            <input
              type="number"
              id="expectedPigeonsPerParticipant"
              name="expectedPigeonsPerParticipant"
              value={formData.expectedPigeonsPerParticipant}
              onChange={handleChange}
              min="1"
              required
            />
          </div>
          <div className="form-group"> {/* Removed full-width, will be paired */}
            <label htmlFor="status">Status:</label>
            <select id="status" name="status" value={formData.status} onChange={handleChange} required>
              <option value="UPCOMING">Upcoming</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group full-width"> {/* Cover photo now takes full width */}
            <label htmlFor="coverPhoto">Cover Photo (Optional):</label>
            <input 
              type="file" 
              id="coverPhoto" 
              name="coverPhoto" 
              onChange={handleFileChange} 
              accept="image/*" // Suggest to browser to filter for image files
            />
            {/* Optional: Display a preview of the selected image */}
            {coverPhotoFile && <img src={URL.createObjectURL(coverPhotoFile)} alt="Cover preview" style={{maxWidth: '200px', marginTop: '10px'}} />}
          </div>
        </div>

        {error && <p className="form-error-message">{error}</p>}
        
        <div className="form-actions">
          <button type="button" onClick={() => navigate('/admin/dashboard')} disabled={loading} className="button secondary-button">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="button primary-button">
            {loading ? 'Creating...' : 'Create Competition'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCompetitionPage;