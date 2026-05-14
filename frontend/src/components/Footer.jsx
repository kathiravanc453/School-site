import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer pt-5">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-widget brand-info">
                        <h2>Annai Therasa <span>Hr Sec School</span></h2>
                        <p className="mt-3">Shaping tomorrow's leaders with world-class education, state-of-the-art facilities, and a curriculum designed for holistic development.</p>
                    </div>

                    <div className="footer-widget quick-links">
                        <h3>Quick Links</h3>
                        <ul>
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/facilities">Facilities</Link></li>
                            <li><Link to="/gallery">Gallery</Link></li>
                            <li><Link to="/admissions">Admissions</Link></li>
                        </ul>
                    </div>

                    <div className="footer-widget quick-links">
                        <h3>Campus Life</h3>
                        <ul>
                            <li><Link to="/facilities#transport">Transport</Link></li>
                            <li><Link to="/facilities#library">Library</Link></li>
                            <li><Link to="/facilities#hostel">Hostel</Link></li>
                            <li><Link to="/facilities#temple">Temple</Link></li>
                            <li><Link to="/facilities#physical-education">Physical Education</Link></li>
                        </ul>
                    </div>

                    <div className="footer-widget contact-info">
                        <h3>Contact Us</h3>
                        <ul>
                            <li><strong>Address:</strong> 123 Education Lane, Knowledge City, NY 10001</li>
                            <li><strong>Phone:</strong> +1 (555) 123-4567</li>
                            <li><strong>Email:</strong> admissions@annaitherasahss.com</li>
                        </ul>
                    </div>

                    <div className="footer-widget map-widget">
                        <h3>Our Location</h3>
                        <div className="map-container">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.1422937950147!2d-73.98731968459391!3d40.75889497932681!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25855c6480299%3A0x55194ec5a1ae072e!2sTimes%20Square!5e0!3m2!1sen!2sus!4v1654101967204!5m2!1sen!2sus"
                                width="100%"
                                height="100%"
                                style={{ border: 0, borderRadius: '8px' }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="School Location Map"
                            ></iframe>
                        </div>

                        {/* Staff & Admin Portal Access */}
                        <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                            <Link
                                to="/staff/login"
                                style={{
                                    flex: 1,
                                    background: 'rgba(59,130,246,0.15)',
                                    border: '1px solid rgba(59,130,246,0.3)',
                                    color: '#60a5fa',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    fontWeight: '600',
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <i className="fa-solid fa-chalkboard-user"></i> Staff Portal
                            </Link>
                            <Link
                                to="/admin"
                                style={{
                                    flex: 1,
                                    background: 'rgba(71,85,105,0.15)',
                                    border: '1px solid rgba(71,85,105,0.4)',
                                    color: '#94a3b8',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    fontWeight: '600',
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <i className="fa-solid fa-lock"></i> Admin Portal
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <div className="social-links-bottom">
                        <a href="#" className="social-icon"><i className="fa-brands fa-facebook-f"></i></a>
                        <a href="#" className="social-icon"><i className="fa-brands fa-twitter"></i></a>
                        <a href="#" className="social-icon"><i className="fa-brands fa-instagram"></i></a>
                        <a href="#" className="social-icon"><i className="fa-brands fa-linkedin-in"></i></a>
                        <a href="#" className="social-icon"><i className="fa-brands fa-youtube"></i></a>
                    </div>
                    <p>&copy; {new Date().getFullYear()} Annai Therasa Hr Sec School. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
