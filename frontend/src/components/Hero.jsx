import React from 'react';
import './Hero.css';

const Hero = () => {
    const scrollToAdmissions = () => {
        document.getElementById('admissions').scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section className="hero">
            <div className="hero-overlay"></div>
            <div className="container hero-content">
                <h1 className="hero-title animate-slide-up delay-1">Shaping Tomorrow's Leaders</h1>
                <div className="hero-badge animate-slide-up delay-2">Admissions Open 2026-27</div>
                <p className="hero-subtitle animate-slide-up delay-3">Grades Pre KG to 9 & 11</p>
                <p className="hero-desc animate-slide-up delay-3">Experience world-class education with state-of-the-art facilities and a curriculum designed for holistic development.</p>
                <button className="btn hero-btn animate-slide-up delay-4" onClick={scrollToAdmissions}>
                    Apply Now
                </button>
            </div>
        </section>
    );
};

export default Hero;
