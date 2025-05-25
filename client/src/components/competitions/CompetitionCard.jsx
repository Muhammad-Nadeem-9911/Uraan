import React from 'react';
import { Link } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import './CompetitionCard.css'; // We'll create this CSS file next
// import placeholderImage from '../../assets/images/pigeon-placeholder.jpg'; // Example placeholder

const CompetitionCard = ({ competition }) => {
  const { _id, name, date, location, status, coverPhotoUrl } = competition; // Changed coverImage to coverPhotoUrl

  const { ref, inView } = useInView({
    triggerOnce: true, // Only trigger the animation once
    threshold: 0.1,    // Trigger when 10% of the card is visible
    delay: 100,        // Small delay before triggering
  });

  // Fallback image if coverImage is not provided
  const displayImage = coverPhotoUrl || 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=60'; // Changed coverImage to coverPhotoUrl

  return (
    <div ref={ref} className={`competition-card ${inView ? 'is-visible' : 'is-hidden'}`}>
      <Link to={`/competition/${_id}`} className="card-link-wrapper">
        <div className="card-image-container">
          <img src={displayImage} alt={`${name} cover`} className="card-image" />
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
            <span className={`card-status-tag status-${status?.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>
            {/* Could add a "View Details" arrow or text here */}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default CompetitionCard;