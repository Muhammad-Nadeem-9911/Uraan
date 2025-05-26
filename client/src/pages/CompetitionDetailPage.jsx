import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import './CompetitionDetailPage.css'; // Import the CSS for styling
import { FaCrown, FaMedal } from 'react-icons/fa'; // Import icons
import Confetti from 'react-confetti'; // Import Confetti
import { motion, AnimatePresence } from 'framer-motion'; // Import framer-motion

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

const CompetitionDetailPage = () => {
  const { id: competitionId } = useParams(); // Get competitionId from URL params
  const [competitionResults, setCompetitionResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: undefined, height: undefined });
  const [animatedChips, setAnimatedChips] = useState({}); // Stores { 'participantId-pigeonNumber': true }
  const prevCompetitionResultsRef = useRef(); // To store previous results for comparison

  const fetchResults = useCallback(async () => { // Encapsulate fetch logic
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/competitions/${competitionId}/results`);
      setCompetitionResults(response.data.data);
      setError(null);
      // Check if competition status is COMPLETED to show confetti initially
      if (response.data.data && response.data.data.status === 'COMPLETED') {
        setShowConfetti(true);
      }
    } catch (err) {
      console.error("Error fetching competition results:", err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch results');
      setCompetitionResults(null);
    } finally {
      setLoading(false);
    }
  }, [competitionId]);

  useEffect(() => {
    

    fetchResults();

    // Setup Socket.IO connection
    const socket = io(SOCKET_URL);
    const roomName = `competition-${competitionId}`;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('joinCompetitionRoom', competitionId); // Join the specific competition room
    });

    socket.on('competitionResultsUpdate', (updatedResults) => {
      console.log('CompetitionDetailPage: Received competitionResultsUpdate event.');
      console.log('Current competitionId on page:', competitionId);
      console.log('Payload received:', JSON.parse(JSON.stringify(updatedResults))); // Deep copy for logging

      // Ensure the update is for the current competition
      // and that the competitionId in the payload matches the current page's competitionId.
      // Also, ensure 'results' is an array (it could be empty if all participants are deleted).
      if (updatedResults && Array.isArray(updatedResults.results) && updatedResults._id && updatedResults._id.toString() === competitionId.toString()) {
        console.log(`CompetitionDetailPage: Applying competitionResultsUpdate for competition ${competitionId}. New participant count in payload: ${updatedResults.results.length}`);
        if (updatedResults.status === 'COMPLETED' && competitionResults?.status !== 'COMPLETED') {
          setShowConfetti(true); // Trigger confetti if status just changed to COMPLETED
        }
        setCompetitionResults(updatedResults);
      } else {
        console.warn('CompetitionDetailPage: Received competitionResultsUpdate, but NOT applying. Condition check failed.');
        console.warn('Details - updatedResults:', updatedResults, 'updatedResults._id:', updatedResults?._id, 'competitionId (page):', competitionId);
      }
    });

    socket.on('competitionDetailsUpdate', (updatedCompetitionDetails) => {
      console.log('CompetitionDetailPage: Received competitionDetailsUpdate:', updatedCompetitionDetails);
      if (updatedCompetitionDetails && updatedCompetitionDetails._id === competitionId) {
        console.log('Details match current competition, re-fetching results due to detail update...');
        if (updatedCompetitionDetails.status === 'COMPLETED' && competitionResults?.status !== 'COMPLETED') {
            setShowConfetti(true);
        }
        fetchResults(); // Re-fetch all results to ensure data consistency
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    // Cleanup on component unmount
    return () => {
      console.log('Cleaning up socket connection for competition:', competitionId);
      socket.disconnect();
    };
  }, [competitionId, fetchResults]); // Re-run effect if competitionId or fetchResults changes

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Call initially
    return () => window.removeEventListener('resize', handleResize);
  }, []);

useEffect(() => {
    // This effect runs after competitionResults has been updated by the socket
    if (prevCompetitionResultsRef.current && competitionResults && prevCompetitionResultsRef.current.results) {
      const oldResultsMap = new Map(
        prevCompetitionResultsRef.current.results.map(r => [
          r.participantId,
          new Map(r.flights?.map(f => [f.pigeonNumber, f.arrivalTime]))
        ])
      );

      const newAnimated = {};
      competitionResults.results?.forEach(newParticipant => {
        const oldParticipantFlightsMap = oldResultsMap.get(newParticipant.participantId);
        newParticipant.flights?.forEach(newFlight => {
          const chipKey = `${newParticipant.participantId}-${newFlight.pigeonNumber}`;
          const oldArrivalTime = oldParticipantFlightsMap?.get(newFlight.pigeonNumber);

          // Animate if the flight is new for this participant or if the arrival time has changed
          if (!oldArrivalTime || (newFlight.arrivalTime && new Date(oldArrivalTime).getTime() !== new Date(newFlight.arrivalTime).getTime())) {
            newAnimated[chipKey] = true;
          }
        });
      });

      if (Object.keys(newAnimated).length > 0) {
        setAnimatedChips(prev => ({ ...prev, ...newAnimated }));
        Object.keys(newAnimated).forEach(key => {
          setTimeout(() => {
            setAnimatedChips(prev => {
              const newState = { ...prev };
              delete newState[key];
              return newState;
            });
          }, 59000); // Duration for the animation class to be applied (approx. 1 minute)
        });
      }
    }
    // Update the ref to the current results for the next comparison
    prevCompetitionResultsRef.current = competitionResults;
  }, [competitionResults]); // This effect depends on competitionResults changing


  const fetchWeatherData = useCallback(async (locationName) => {
    if (!locationName || locationName === 'N/A') {
      setWeatherError("Location not specified.");
      setWeatherData(null);
      return;
    }
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    if (!apiKey) {
      console.error("Weather API key (VITE_WEATHER_API_KEY) is missing in .env file.");
      setWeatherError("Weather service not configured.");
      setWeatherData(null);
      return;
    }

    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const weatherResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(locationName)}&appid=${apiKey}&units=metric`
      );
      setWeatherData(weatherResponse.data);
    } catch (err) {
      console.error("Error fetching weather data:", err);
      setWeatherError(err.response?.data?.message || "Could not fetch weather.");
      setWeatherData(null);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    if (competitionResults && competitionResults.location && competitionResults.location !== 'N/A') {
      fetchWeatherData(competitionResults.location);
    } else if (competitionResults) { // If competitionResults loaded but no valid location
        setWeatherData(null); // Clear previous weather data
        // Optionally set a specific message if location is explicitly N/A or missing
        if (!competitionResults.location || competitionResults.location === 'N/A') setWeatherError("Location not specified.");
    }
  }, [competitionResults, fetchWeatherData]);

  const getWeatherDisplay = () => {
    if (weatherLoading) return "Loading weather...";

    if (weatherData && weatherData.weather && weatherData.weather.length > 0) {
      const mainCondition = weatherData.weather[0].main;
      const description = weatherData.weather[0].description;
      const temp = weatherData.main?.temp;
      // const iconCode = weatherData.weather[0].icon;
      // Example with icon: return <><img src={`http://openweathermap.org/img/wn/${iconCode}.png`} alt={description} /> {`${mainCondition}, ${temp}°C`}</>;
      return `${mainCondition} (${description})${temp !== undefined ? `, ${temp.toFixed(1)}°C` : ''}`;
    }

    // Fallback to manually entered weather or error messages
    if (weatherError && weatherError !== "Location not specified.") {
        // If there was an error fetching, but we have a manually entered weather, show that with a note
        return competitionResults?.weather && competitionResults.weather !== 'N/A'
            ? `${competitionResults.weather} (Live: ${weatherError.substring(0,25)}...)`
            : `N/A (Live: ${weatherError.substring(0,25)}...)`;
    }
    // If location was not specified for API call
    if (weatherError === "Location not specified.") {
        return competitionResults?.weather || 'N/A (Location not specified)';
    }

    return competitionResults?.weather || 'N/A'; // Default fallback
  };

  if (loading) {
    return <div className="loading-message">Loading competition details...</div>;
  }
  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }
  if (!competitionResults) {
    return <div className="info-message">No results found for this competition.</div>;
  }

  // The 'results' array from competitionResults is already sorted by rank by the backend
  const {
    competitionName,
    competitionDate: competitionDateValue, // Use competitionDate from payload
    competitionStartTime: competitionStartTimeValue, // Use competitionStartTime from payload
    location,                   // This will be undefined if not in payload
    coverImage,                 // This will be undefined if not in payload
    status,                     // Destructure the competition status
    weather,                    // This will be undefined if not in payload
    totalPigeonsOverall,        // Assuming this field exists for total pigeons in comp
    results: originalResults,
    expectedPigeonsPerParticipant
  } = competitionResults;

  // Sort results for "Top 3 by Longest Time" display (user's existing logic)
  // We create a new sorted array to avoid mutating the original state directly if it's used elsewhere.
  const displayedResultsByTime = originalResults ? [...originalResults].sort((a, b) => b.totalFlightDurationSeconds - a.totalFlightDurationSeconds) : [];

  const firstPlaceByHighestTime = displayedResultsByTime.length > 0 ? displayedResultsByTime[0] : null;
  const secondPlaceByHighestTime = displayedResultsByTime.length > 1 ? displayedResultsByTime[1] : null;
  const thirdPlaceByHighestTime = displayedResultsByTime.length > 2 ? displayedResultsByTime[2] : null;

  // Helper to format duration from seconds to HH:MM:SS or MM:SS
  const formatDuration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    let formatted = '';
    if (hours > 0) formatted += `${hours}h `;
    formatted += `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
    return formatted;
  };

  // Generate headers for pigeon columns
  const pigeonColumnHeaders = [];
  if (expectedPigeonsPerParticipant > 0) {
    for (let i = 1; i <= expectedPigeonsPerParticipant; i++) {
      pigeonColumnHeaders.push(<th key={`pigeon-header-${i}`}>Pigeon {i}</th>);
    }
  }

  const competitionFullDate = competitionDateValue ? new Date(competitionDateValue).toLocaleDateString() : 'N/A';
  const competitionDisplayStartTime = competitionStartTimeValue ? new Date(competitionStartTimeValue).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
  const totalParticipants = originalResults?.length || 0;
  // Calculate total pigeons if not directly available
  const totalPigeonsInCompetition = totalPigeonsOverall || (originalResults ? originalResults.reduce((sum, p) => sum + (p.flights?.length || 0), 0) : 0);

  return (
    <div className="competition-detail-page">
      {showConfetti && windowSize.width && windowSize.height && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false} // Set to true if you want it to run continuously for a bit
          numberOfPieces={300} // Adjust for more/less confetti
          onConfettiComplete={() => setShowConfetti(false)} // Optional: stop rendering after animation
        />
      )}
      {/* 2. Hero/Header Section */}
      <header className="competition-header">
        <div className="header-background-image" style={{ backgroundImage: `url(${coverImage || '/images/default-banner.jpg'})` }}>
          <div className="header-overlay"></div>
        </div>
        <div className="header-content">
          <div className="header-meta">
            <span>Date: {competitionFullDate}</span>
            <span>Location: {location || 'N/A'}</span>
            <span className="weather-info">
              {getWeatherDisplay()}
            </span>
          </div>
        </div>
      </header>

      {/* Page Title Section - MOVED HERE (Below Hero) */}
      <div className="page-title-container">
        <h1 dir="auto">{competitionName}</h1>
      </div>

      {/* 3. Competition Stats Block */}
      <section className="competition-stats-block">
        <div className="stat-item">
          <span className="stat-icon">🕒</span> {/* Placeholder icon, replace with FaClock or WiTime */}
          <span className="stat-value">{competitionDisplayStartTime}</span>
          <span className="stat-label">Start Time</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">👥</span> {/* Placeholder icon, replace with FaUsers */}
          <span className="stat-value" dir="auto">{totalParticipants}</span>
          <span className="stat-label">Total Participants</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🕊️</span> {/* Placeholder icon, replace with FaDove */}
          <span className="stat-value">{totalPigeonsInCompetition}</span>
          <span className="stat-label">Total Pigeons</span>
        </div>
        <div className="stat-item status-stat-item"> {/* Added new class for potential specific styling */}
          <span className="stat-icon">📊</span> {/* Placeholder icon, can be dynamic */} {/* Consider if status text needs dir="auto" if it can be multilingual */}
          <span className="stat-value status-text-value">{status || 'N/A'}</span> {/* Using stat-value for consistency, added specific class */}
          <span className="stat-label">Competition Status</span>
        </div>
      </section>

      {/* Existing "Top 3 by Longest Time" - can be styled or integrated into main leaderboard later */}
      <section className="top-by-time-section">
        <h3>Top Finishers</h3>
        <div className="top-finishers-grid">
          {firstPlaceByHighestTime && (
            <div className="top-finisher-card first-place">
              <div className="finisher-rank-icon"><FaCrown /></div>
              <div className="finisher-rank-text">1st Place</div>
              <div className="finisher-name" dir="auto">{firstPlaceByHighestTime.participantName}</div> {/* Already had dir="auto", good! */}
              <div className="finisher-time">{formatDuration(firstPlaceByHighestTime.totalFlightDurationSeconds)}</div>
              <div className="finisher-official-rank">(Official Rank: {firstPlaceByHighestTime.rank})</div>
            </div>
          )}
          {secondPlaceByHighestTime && (
            <div className="top-finisher-card second-place">
              <div className="finisher-rank-icon"><FaMedal /></div>
              <div className="finisher-rank-text">2nd Place</div>
              <div className="finisher-name" dir="auto">{secondPlaceByHighestTime.participantName}</div> {/* Already had dir="auto", good! */}
              <div className="finisher-time">{formatDuration(secondPlaceByHighestTime.totalFlightDurationSeconds)}</div>
              <div className="finisher-official-rank">(Official Rank: {secondPlaceByHighestTime.rank})</div>
            </div>
          )}
          {thirdPlaceByHighestTime && (
            <div className="top-finisher-card third-place">
              <div className="finisher-rank-icon"><FaMedal /></div>
              <div className="finisher-rank-text">3rd Place</div>
              <div className="finisher-name" dir="auto">{thirdPlaceByHighestTime.participantName}</div> {/* Already had dir="auto", good! */}
              <div className="finisher-time">{formatDuration(thirdPlaceByHighestTime.totalFlightDurationSeconds)}</div>
              <div className="finisher-official-rank">(Official Rank: {thirdPlaceByHighestTime.rank})</div>
            </div>
          )}
        </div>
        {(!firstPlaceByHighestTime && !secondPlaceByHighestTime && !thirdPlaceByHighestTime) && (
            <p className="info-message">Top finisher data not yet available.</p>
        )}
      </section>

      {/* 4. Leaderboard Section (Official Ranks) */}
      <section className="leaderboard-section">
        <h2>Official Leaderboard</h2>
        {originalResults && originalResults.length > 0 ? (
          <div className="leaderboard-table-container">
            <table>
              <thead>
                <tr>
                  <th className="sticky-col sticky-col-rank">Rank</th>
                  <th className="sticky-col sticky-col-participant">Participant</th> {/* Header for Avatar + Name */}
                  <th className="sticky-col sticky-col-pigeons-returned">Pigeons Returned</th>
                  {pigeonColumnHeaders}
                  <th className="sticky-col sticky-col-total-time">Total Time</th>
                  {/* Add more headers if needed, e.g., for specific pigeon details */}
                </tr>
              </thead>
              {/* Use AnimatePresence to handle enter/exit animations if rows are added/removed */}
              <AnimatePresence>
                {originalResults.map((result) => ( // Use originalResults for official rank order
                  <motion.tr
                    key={result.participantId} // Stable key is crucial for layout animations
                    layout // Enables layout animation
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className={result.rank <= 3 ? `top-rank-row rank-row-${result.rank}` : ''}
                  >
                    <td className={`sticky-col sticky-col-rank rank-cell rank-${result.rank}`}>
                      <span className="rank-badge">{result.rank}</span>
                    </td>
                    <td className="sticky-col sticky-col-participant participant-info-cell">
                      <img src={result.participantPictureUrl || '/images/default-avatar.png'} alt={result.participantName} className="participant-avatar" />
                      <span className="participant-name-text" dir="auto">{result.participantName}</span> {/* Already had dir="auto", good! */}
                    </td>
                    <td className="sticky-col sticky-col-pigeons-returned">{result.numberOfPigeonsRecorded} / {expectedPigeonsPerParticipant || 'N/A'}</td>
                    {expectedPigeonsPerParticipant > 0 && Array.from({ length: expectedPigeonsPerParticipant }, (_, i) => {
                      const pigeonNumber = i + 1;
                      const flight = result.flights.find(f => f.pigeonNumber === pigeonNumber);
                      return (
                        <td key={`pigeon-cell-${result.participantId}-${pigeonNumber}`} className="pigeon-arrival-time-cell">
                          {flight ? (
                            <span 
                              className={`time-chip ${animatedChips[`${result.participantId}-${flight.pigeonNumber}`] ? 'animate-highlight' : ''}`}
                            >
                              {new Date(flight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          ) : '-'}
                        </td>
                      );
                    })}
                    <td className="sticky-col sticky-col-total-time total-time-cell">{formatDuration(result.totalFlightDurationSeconds)}</td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </table>
          </div>
        ) : (
          <p className="info-message">No participants or results yet for this competition.</p>
        )}
      </section>
    </div>
  );
};

export default CompetitionDetailPage;