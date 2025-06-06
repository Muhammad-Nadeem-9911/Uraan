import React from 'react';
import { Link } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import './CompetitionCard.css'; // We'll create this CSS file next


const CompetitionCard = ({ competition }) => {
  const { _id, name, date, location, status, coverPhotoUrl } = competition; // Changed coverImage to coverPhotoUrl

  const { ref, inView } = useInView({
    triggerOnce: true, // Only trigger the animation once
    threshold: 0.1,    // Trigger when 10% of the card is visible
    delay: 100,        // Small delay before triggering
  });

  // Fallback image if coverImage is not provided
  // The gradient fallback will be handled directly in the style prop below,
  // similar to CompetitionDetailPage.jsx

  return (
    <div ref={ref} className={`competition-card ${inView ? 'is-visible' : 'is-hidden'}`}>
      <Link to={`/competition/${_id}`} className="card-link-wrapper competition-interactive-card">
        <div className="card-image-container">
          <div
            className="card-image"
            style={{
              backgroundImage: competition.coverPhotoUrl // Use competition.coverPhotoUrl here
                ? `url(${competition.coverPhotoUrl})`
                : 'linear-gradient(135deg, #232526 0%, #414345 100%)', // Default dark gradient
            }}
            aria-label={`${name} cover`} // Add aria-label for accessibility
          ></div>
          <div className="card-image-overlay">
            {/* Play button if it has a video - future enhancement */}
            {/* <span className="play-button">▶</span> */}
          </div>
        </div>
        <div className="card-content">
          <h3 className="card-title truncate-text" title={name} dir="auto">{name}</h3> {/* Apply truncate, add title and dir="auto" */}
          <p className="card-info"><strong>Date:</strong> {new Date(date).toLocaleDateString()}</p>
          <p className="card-info"><strong>Location:</strong> {location || 'N/A'}</p>
          <div className="card-footer">
            <span className={`status-tag status-${status?.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>
            {/* Could add a "View Details" arrow or text here */}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CompetitionCard;