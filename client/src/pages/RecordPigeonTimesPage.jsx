import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

import { toast } from 'react-toastify';
import { truncateText } from '../utils/textUtils'; // Corrected import path
import './RecordPigeonTimesPage.css'; // Import the CSS file
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const RecordPigeonTimesPage = () => {
  const { competitionId, participantId } = useParams();
  const navigate = useNavigate();

  const [competition, setCompetition] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [pigeonTimes, setPigeonTimes] = useState([]); // Array of objects: { pigeonNumber: 1, arrivalTime: '' }
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch competition details (to get expectedPigeonsPerParticipant and startTime)
      const compResponse = await axios.get(`${API_BASE_URL}/competitions/${competitionId}`);
      const currentCompetition = compResponse.data.data;
      setCompetition(currentCompetition);

      // Fetch participant details
      const partResponse = await axios.get(`${API_BASE_URL}/participants/${participantId}`);
      setParticipant(partResponse.data.data);

      // Fetch existing pigeon flights for this participant in this competition
      const flightsResponse = await axios.get(`${API_BASE_URL}/pigeonflights?participantId=${participantId}`);
      const existingFlights = flightsResponse.data.data.filter(flight => flight.competition._id === competitionId || flight.competition === competitionId);

      // Initialize pigeonTimes state
      const initialTimes = [];
      const expectedPigeons = currentCompetition.expectedPigeonsPerParticipant || 1; // Default to 1 if not set

      for (let i = 1; i <= expectedPigeons; i++) {
        const existingFlight = existingFlights.find(f => f.pigeonNumber === i);
        initialTimes.push({
          pigeonNumber: i,
          arrivalTime: existingFlight?.arrivalTime ? (() => {
            // Convert stored UTC arrivalTime to local YYYY-MM-DDTHH:MM for the input
            const localDateTime = new Date(existingFlight.arrivalTime); // Creates Date object in local timezone
            const year = localDateTime.getFullYear();
            const month = String(localDateTime.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
            const day = String(localDateTime.getDate()).padStart(2, '0');
            const hours = String(localDateTime.getHours()).padStart(2, '0');
            const minutes = String(localDateTime.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
          })()
          : '',
          _id: existingFlight?._id || null // Store existing flight ID if any
        });
      }
      setPigeonTimes(initialTimes);

    } catch (err) {
      console.error("Error fetching initial data:", err);
      setError(err.response?.data?.message || err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [competitionId, participantId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleTimeChange = (index, value) => {
    const updatedTimes = [...pigeonTimes];
    updatedTimes[index].arrivalTime = value;
    setPigeonTimes(updatedTimes);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    // setSuccessMessage(''); // No longer needed
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setError('Authentication error. Please log in again.');
      navigate('/admin/login');
      setSaving(false);
      return;
    }

    try {
      // Iterate through pigeonTimes and save each one that has an arrivalTime
      for (const pigeonEntry of pigeonTimes) {
        if (pigeonEntry.arrivalTime) { // If there's a time, upsert it
          const payload = {
            participantId,
            competitionId,
            pigeonNumber: pigeonEntry.pigeonNumber,
            arrivalTime: new Date(pigeonEntry.arrivalTime).toISOString(), // Ensure ISO format
          };
          await axios.post(`${API_BASE_URL}/pigeonflights/record`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else if (!pigeonEntry.arrivalTime && pigeonEntry._id) {
          // If arrivalTime is now empty AND there was a previous record (pigeonEntry._id exists), delete it.
          console.log(`Attempting to delete PigeonFlight record with ID: ${pigeonEntry._id}`);
          await axios.delete(`${API_BASE_URL}/pigeonflights/${pigeonEntry._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
        // If arrivalTime is empty and no pigeonEntry._id, do nothing (it was never saved).
      }
      toast.success('Pigeon times saved successfully!'); // Use toast for success
      fetchInitialData(); // Re-fetch to get latest data, including any new _ids for upserted records
                          // and to clear _id for deleted records from local state.
      // Optionally, navigate back or refresh data
    } catch (err) {
      console.error("Error saving pigeon times:", err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save pigeon times.';
      setError(errorMessage); // Keep for potential inline display if needed
      toast.error(errorMessage); // Use toast for error
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-loading-message">Loading data...</div>;
  if (error && !competition && !loading) return <div className="page-error-message">Error: {error}</div>;
  if ((!competition || !participant) && !loading) return <div className="page-error-message">Competition or Participant details not found.</div>;

  return (
    <div className="record-times-page">
      <div className="page-header">
        <Link to={`/admin/competitions/${competitionId}/participants`} className="back-link">
          &larr; Back to Participants
        </Link>
        <h2>Record Pigeon Times</h2>
        {competition && (
          <p className="context-info">
            Competition: <strong>{truncateText(competition.name, 40)}</strong>
          </p>
        )}
        {participant && (
          <p className="context-info">
            Participant: <strong dir="auto">{participant.name}</strong>
          </p>
        )}
        {competition && (
          <p className="competition-start-time">
            Competition Start Time: {new Date(competition.startTime).toLocaleString()}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="record-times-form">
        {pigeonTimes.map((pigeon, index) => (
          <div key={pigeon.pigeonNumber} className="pigeon-time-entry">
            <label htmlFor={`pigeon-${pigeon.pigeonNumber}-time`}>
              Pigeon {pigeon.pigeonNumber} Arrival:
            </label>
            <input
              type="datetime-local"
              id={`pigeon-${pigeon.pigeonNumber}-time`}
              value={pigeon.arrivalTime}
              onChange={(e) => handleTimeChange(index, e.target.value)}
              // Consider adding min/max attributes based on competition.startTime
              // min={competition?.startTime ? new Date(new Date(competition.startTime).getTime() - 1000*60*60*24).toISOString().slice(0,16) : undefined} // Example: min 1 day before start
            />
          </div>
        ))}

        {error && <div className="form-error-message">{error}</div>}
        
        <button type="submit" className="submit-button" disabled={saving || loading}>
          {saving ? 'Saving...' : 'Save All Pigeon Times'}
        </button>
      </form>
    </div>
  );
};

export default RecordPigeonTimesPage;