import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { FaFilter, FaChevronDown, FaChevronUp } from 'react-icons/fa'; // Example icons
// import { Link } from 'react-router-dom'; // Link is not used directly in this file anymore
import io from 'socket.io-client'; // Import socket.io-client
import HeroSection from '../components/home/HeroSection'; // Import the HeroSection
import CompetitionCard from '../components/competitions/CompetitionCard'; // Import CompetitionCard
import CompetitionCardSkeleton from '../components/competitions/CompetitionCardSkeleton'; // Import Skeleton
import './HomePage.css'; // Import HomePage specific styles

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL; // Ensure this is in your .env file

const HomePage = () => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroSlides, setHeroSlides] = useState([]);
  const [heroLoading, setHeroLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // e.g., 'UPCOMING', 'ONGOING'
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  // const [filteredCompetitions, setFilteredCompetitions] = useState([]); // Replaced by useMemo
  const [isFiltersOpen, setIsFiltersOpen] = useState(false); // State for filter visibility

  useEffect(() => {
    const fetchHeroSlides = async () => {
      setHeroLoading(true);
      try {
        // Fetch only active slides for the homepage
        const response = await axios.get(`${API_BASE_URL}/hero-slides?activeOnly=true`);
        setHeroSlides(response.data.data || []);
      } catch (err) {
        console.error("Error fetching hero slides:", err);
        // Optionally set an error state for hero slides or just log it
        setHeroSlides([]); // Default to empty array on error
      } finally {
        setHeroLoading(false);
      }
    };

    // Function to fetch competitions
    const fetchCompetitions = async () => { // Renamed to avoid conflict
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/competitions`);
            setCompetitions(response.data.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching competitions:", err);
            setError(err.response?.data?.message || err.message || 'Failed to fetch competitions');
            setCompetitions([]);
        } finally {
            setLoading(false);
        }
    };

    fetchHeroSlides();
    fetchCompetitions();

    // Setup Socket.IO connection
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log('HomePage: Socket connected:', socket.id);
    });

    socket.on('competitionsListUpdated', (data) => {
      console.log('HomePage: Received competitionsListUpdated event', data);
      // Re-fetch the competitions list when this event is received
      fetchCompetitions();
    });

    socket.on('heroSlidesUpdated', () => {
      console.log('HomePage: Received heroSlidesUpdated event');
      // Re-fetch the hero slides list when this event is received
      fetchHeroSlides();
    });

    socket.on('disconnect', () => {
      console.log('HomePage: Socket disconnected');
    });

    // Cleanup on component unmount
    return () => {
      console.log('HomePage: Cleaning up socket connection');
      socket.disconnect();
    };
  }, []); // Empty dependency array: runs once on mount for initial fetch and socket setup

  // Memoized filtering logic
  const filteredCompetitions = useMemo(() => {
    let tempFiltered = competitions;

    if (searchTerm) {
      tempFiltered = tempFiltered.filter(comp =>
        comp.competitionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (comp.description && comp.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterLocation) {
      tempFiltered = tempFiltered.filter(comp =>
        comp.location && comp.location.toLowerCase().includes(filterLocation.toLowerCase())
      );
    }

    if (filterStatus) {
      // Assuming competition.status is 'UPCOMING', 'ONGOING', 'COMPLETED' etc.
      tempFiltered = tempFiltered.filter(comp => comp.status && comp.status.toUpperCase() === filterStatus.toUpperCase());
    }

    if (filterStartDate) {
      const startDate = new Date(filterStartDate);
      startDate.setHours(0, 0, 0, 0); // Compare from the start of the day
      tempFiltered = tempFiltered.filter(comp => {
        const compDate = new Date(comp.competitionDate);
        return compDate >= startDate;
      });
    }

    if (filterEndDate) {
      const endDate = new Date(filterEndDate);
      endDate.setHours(23, 59, 59, 999); // Compare until the end of the day
      tempFiltered = tempFiltered.filter(comp => {
        const compDate = new Date(comp.competitionDate);
        return compDate <= endDate;
      });
    }

    return tempFiltered;
  }, [competitions, searchTerm, filterLocation, filterStatus, filterStartDate, filterEndDate]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterLocation('');
    setFilterStatus('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const toggleFilters = () => {
    setIsFiltersOpen(!isFiltersOpen);
  };


  if (loading || heroLoading) { // Check both loading states
    return (
      <div className="home-page-container">
        <HeroSection slides={heroSlides} isLoading={heroLoading} /> {/* Pass slides and loading state */}
        <section className="competitions-section" id="competitions-grid">
          <h2 className="section-title">Competitions</h2>
          <div className="competitions-grid-layout">
            {/* Display a few skeleton cards */}
            {[...Array(6)].map((_, index) => <CompetitionCardSkeleton key={index} />)}
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="home-page-container">
      <HeroSection slides={heroSlides} isLoading={heroLoading} /> {/* Pass slides and loading state */}
      {/* Filters Section */}
      <section className="filters-section">
        <div className="filters-header">
          <h3 className="filters-title">Filter Competitions</h3>
          <button onClick={toggleFilters} className="filter-toggle-button">
            {/* Using icons for mobile friendliness, text for clarity */}
            <span className="filter-toggle-icon">{isFiltersOpen ? <FaChevronUp /> : <FaChevronDown />}</span>
            <span className="filter-toggle-text">{isFiltersOpen ? 'Hide' : 'Show'} Filters</span>
          </button>
        </div>
        <div className={`filter-controls-wrapper ${isFiltersOpen ? 'open' : ''}`}>
          <div className="filter-controls">
            <input
              type="text"
              placeholder="Search by keyword..."
              className="filter-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <input
              type="text"
              placeholder="Location..."
              className="filter-input"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
            />
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Status</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <div className="filter-date-group">
              <label htmlFor="startDate">From:</label>
              <input type="date" id="startDate" className="filter-date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
            </div>
            <div className="filter-date-group">
              <label htmlFor="endDate">To:</label>
              <input type="date" id="endDate" className="filter-date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
            </div>
            <div className="filter-button-wrapper">
              <button onClick={handleClearFilters} className="filter-button clear-filters-button">
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="competitions-section" id="competitions-grid"> {/* id for hero CTA scroll target */}
        <h2 className="section-title">Competitions</h2>
        {filteredCompetitions.length === 0 ? (
          <p className="no-competitions-message">No competitions found at the moment. Check back soon!</p>
        ) : (
          <div className="competitions-grid-layout">
            {filteredCompetitions.map((competition) => (
              <CompetitionCard key={competition._id} competition={competition} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;