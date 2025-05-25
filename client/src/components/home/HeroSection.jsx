import React from 'react';
import { Link } from 'react-router-dom';
import Slider from 'react-slick'; // Import react-slick
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import './HeroSection.css'; // We'll create this CSS file next
// You might want to import your actual logo image here
// import logo from '../../assets/logo.png'; // Example path
const DEFAULT_HERO_IMAGE = '/images/default-hero-background.jpg'; // Define a path to a default local image

const HeroSection = ({ slides, isLoading }) => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000, // Change slide every 5 seconds
    fade: true, // Optional: for fade effect instead of slide
    pauseOnHover: true,
    adaptiveHeight: true, // Adjusts height to current slide
  };

  if (isLoading) {
    return (
      <div className="hero-section hero-loading">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-logo-text">Loading Uraan...</h1>
          <p className="hero-tagline">Preparing the skies...</p>
        </div>
      </div>
    );
  }

  if (!slides || slides.length === 0) {
    // Fallback to a static hero if no slides are available
    return (
      <div className="hero-section" style={{ backgroundImage: `url(${DEFAULT_HERO_IMAGE})` }}>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-logo-text">Uraan</h1>
          <p className="hero-tagline">Where Wings Compete</p>
        </div>
      </div>
    );
  }

  return (
    <Slider {...settings} className="hero-carousel">
      {slides.map((slide) => (
        <div key={slide._id} className="hero-slide-item"> {/* Outer div for react-slick */}
          {slide.linkUrl ? (
            <Link to={slide.linkUrl} className="hero-slide-link-wrapper">
              <div
                className="hero-slide-background"
                style={{ backgroundImage: `url(${slide.imageUrl || DEFAULT_HERO_IMAGE})` }}
              >
                <div className="hero-overlay"></div>
                {/* Content inside the link can be minimal or just the overlay for clickability */}
              </div>
            </Link>
          ) : (
            <div
              className="hero-slide-background"
              style={{ backgroundImage: `url(${slide.imageUrl || DEFAULT_HERO_IMAGE})` }}
            >
              <div className="hero-overlay"></div>
            </div>
          )}
        </div>
      ))}
    </Slider>
  );
};

export default HeroSection;