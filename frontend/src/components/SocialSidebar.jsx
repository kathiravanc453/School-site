import React from 'react';
import './SocialSidebar.css';

const SocialSidebar = () => {
    return (
        <div className="social-sidebar">
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="social-btn facebook" aria-label="Facebook">
                <div className="social-icon">
                    <i className="fa-brands fa-facebook-f"></i>
                </div>
                <span className="social-text">Facebook</span>
            </a>
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="social-btn instagram" aria-label="Instagram">
                <div className="social-icon">
                    <i className="fa-brands fa-instagram"></i>
                </div>
                <span className="social-text">Instagram</span>
            </a>
            <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="social-btn youtube" aria-label="YouTube">
                <div className="social-icon">
                    <i className="fa-brands fa-youtube" style={{ color: '#fff', backgroundColor: 'transparent' }}></i>
                </div>
                <span className="social-text">YouTube</span>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-btn x-twitter" aria-label="X (Twitter)">
                <div className="social-icon">
                    <i className="fa-brands fa-x-twitter"></i>
                </div>
                <span className="social-text">Twitter</span>
            </a>
            <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="social-btn linkedin" aria-label="LinkedIn">
                <div className="social-icon">
                    <i className="fa-brands fa-linkedin-in"></i>
                </div>
                <span className="social-text">LinkedIn</span>
            </a>
        </div>
    );
};

export default SocialSidebar;
