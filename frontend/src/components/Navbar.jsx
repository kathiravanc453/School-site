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
                <div className="logo">
                    <Link to="/">
                        <h2>Edu<span>Connect</span></h2>
                    </Link>
                </div>

                <div className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
                    <Link to="/" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
                    <Link to="/events" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Events</Link>
                    <Link to="/facilities" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Facilities</Link>
                    <Link to="/faculty" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Faculty</Link>
                    <Link to="/gallery" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Gallery</Link>
                    <Link to="/alumni" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Alumni</Link>
                    <Link to="/achievements" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Achievements</Link>
                    <Link to="/admissions" className="btn btn-apply" onClick={() => setIsMobileMenuOpen(false)}>Admissions</Link>
                    <Link to="/admin" className="nav-link admin-link" onClick={() => setIsMobileMenuOpen(false)}>
                        <i className="fa-solid fa-lock" style={{ marginRight: '6px', fontSize: '0.8rem' }}></i>
                        Admin
                    </Link>
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
