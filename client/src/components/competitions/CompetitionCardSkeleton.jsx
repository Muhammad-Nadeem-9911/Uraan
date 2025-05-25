import React from 'react';
import './CompetitionCardSkeleton.css'; // We'll create this CSS file next

const CompetitionCardSkeleton = () => {
  return (
    <div className="competition-card-skeleton">
      <div className="skeleton-image"></div>
      <div className="skeleton-content">
        <div className="skeleton-line title"></div>
        <div className="skeleton-line short"></div>
        <div className="skeleton-line medium"></div>
        <div className="skeleton-line short footer"></div>
      </div>
    </div>
  );
};

export default CompetitionCardSkeleton;