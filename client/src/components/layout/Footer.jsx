import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css'; // We'll create this CSS file next
// import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa'; // Example for social icons

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-divider"></div> {/* For the feather-shaped or decorative divider */}
      <div className="footer-content">
        <div className="footer-links">
          {/* <Link to="/about-us">About Us</Link>
          <Link to="/past-champions">Past Champions</Link>
          <Link to="/contact">Contact</Link> */}
        </div>
        <div className="footer-social">
          {/* Placeholder for social icons - using text for now */}
          {/* <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><FaFacebook /></a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FaInstagram /></a> */}
        </div>
        <p className="footer-copyright">&copy; {currentYear} Uraan. All Rights Reserved. "Where Wings Compete"</p>
      </div>
    </footer>
  );
};

export default Footer;