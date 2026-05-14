import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
            <div className="container nav-container">
                <div className="school-brand">
                    <div className="school-brand-icon">
                        <i className="fa-solid fa-graduation-cap"></i>
                    </div>
                    <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="school-brand-text">
                            <h2>Annai Therasa</h2>
                            <span>Hr. Sec. School</span>
                        </div>
                    </Link>
                </div>

                <div className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
                    <Link to="/" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
                    <Link to="/academics" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Academics</Link>
                    <Link to="/events" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Events</Link>
                    <Link to="/facilities" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Facilities</Link>
                    <Link to="/faculty" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Faculty</Link>
                    <Link to="/gallery" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Gallery</Link>
                    <Link to="/alumni" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Alumni</Link>
                    <Link to="/achievements" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Achievements</Link>
                    <Link to="/student-fees" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Fees Details</Link>
                    <Link to="/student-results" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Exam Results</Link>
                    <Link to="/admissions" className="btn btn-apply" onClick={() => setIsMobileMenuOpen(false)}>Admissions</Link>
                </div>

                <div className="mobile-toggle" onClick={toggleMenu}>
                    <span className={`bar ${isMobileMenuOpen ? 'open' : ''}`}></span>
                    <span className={`bar ${isMobileMenuOpen ? 'open' : ''}`}></span>
                    <span className={`bar ${isMobileMenuOpen ? 'open' : ''}`}></span>
                </div>
            </div >
        </nav >
    );
};

export default Navbar;
