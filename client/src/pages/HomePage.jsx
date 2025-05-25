import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
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

  if (loading || heroLoading) { // Check both loading states
    return (
      <div className="home-page-container">
        <HeroSection slides={heroSlides} isLoading={heroLoading} /> {/* Pass slides and loading state */}
        <section className="competitions-section" id="competitions-grid">
          <h2 className="section-title">Upcoming & Ongoing Competitions</h2>
          <div className="competitions-grid-layout">
            {/* Display a few skeleton cards */}
            {[...Array(6)].map((_, index) => <CompetitionCardSkeleton key={index} />)}
          </div>
        </section>
      </div>
    );  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="home-page-container">
      <HeroSection slides={heroSlides} isLoading={heroLoading} /> {/* Pass slides and loading state */}
      <section className="competitions-section" id="competitions-grid"> {/* id for hero CTA scroll target */}
        <h2 className="section-title">Upcoming & Ongoing Competitions</h2>
        {competitions.length === 0 ? (
          <p className="no-competitions-message">No competitions found at the moment. Check back soon!</p>
        ) : (
          <div className="competitions-grid-layout">
            {competitions.map((competition) => (
              <CompetitionCard key={competition._id} competition={competition} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;