import React from 'react';
import './Academics.css';
import { Link } from 'react-router-dom';

const Academics = () => {
    const curriculums = [
        {
            title: "Kindergarten (LKG & UKG)",
            icon: "🧸",
            color: "#f472b6", // pink
            description: "A nurturing environment focusing on foundational learning, socialization, and play-based skill development.",
            subjects: ["English Phonics", "Basic Numeracy", "Rhymes & Storytelling", "Arts & Crafts", "Environmental Awareness"]
        },
        {
            title: "Primary (1st to 5th Standard)",
            icon: "🎒",
            color: "#3b82f6", // blue
            description: "Building strong academic basics, encouraging curiosity, and developing reading, writing, and analytical skills.",
            subjects: ["English", "Tamil", "Mathematics", "Science", "Social Science", "Computer Basics", "Moral Science"]
        },
        {
            title: "Middle School (6th to 8th Standard)",
            icon: "🔬",
            color: "#10b981", // green
            description: "Transitioning to deeper conceptual understanding, critical thinking, and independent project work.",
            subjects: ["English Literature", "Tamil", "Advanced Math", "Physics, Chem, Bio Basics", "History & Civics", "Geography", "Computer Science"]
        },
        {
            title: "High School (9th & 10th Standard)",
            icon: "📐",
            color: "#f59e0b", // yellow/orange
            description: "Rigorous academic preparation focusing on board exam readiness and foundational career skills.",
            subjects: ["English", "Tamil", "Mathematics", "Science (Phy, Chem, Bio)", "Social Science", "Information Technology"]
        },
        {
            title: "Higher Secondary (11th & 12th Standard)",
            icon: "🎓",
            color: "#8b5cf6", // purple
            description: "Specialized streams designed to prepare students for professional college degrees and competitive exams.",
            subjects: [
                "Group 1: Maths, Physics, Chemistry, Biology", 
                "Group 2: Maths, Physics, Chemistry, Computer Science", 
                "Group 3: Commerce, Accountancy, Economics, Business Math/Computer"
            ]
        }
    ];

    return (
        <div className="academics-container">
            {/* Hero Section */}
            <section className="academics-hero">
                <div className="academics-hero-content">
                    <h1>Academic Excellence</h1>
                    <p>Empowering minds from Kindergarten to Higher Secondary through a comprehensive, modern curriculum.</p>
                </div>
            </section>

            {/* Introduction */}
            <section className="academics-intro">
                <div className="container">
                    <div className="intro-grid">
                        <div className="intro-text">
                            <h2>Our Educational Philosophy</h2>
                            <p>At Annai Therasa Hr. Sec. School, we believe that education goes beyond textbooks. Our curriculum is designed to foster critical thinking, creativity, and moral integrity.</p>
                            <p>We provide a student-centered approach, ensuring that every child receives the attention they need to discover their passions and excel in their chosen paths.</p>
                            <ul className="feature-list">
                                <li><i className="fa-solid fa-check-circle"></i> Experienced & Dedicated Faculty</li>
                                <li><i className="fa-solid fa-check-circle"></i> Smart Classrooms & Digital Learning</li>
                                <li><i className="fa-solid fa-check-circle"></i> Holistic Development (Sports & Arts)</li>
                            </ul>
                        </div>
                        <div className="intro-image-wrapper">
                            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Students collaborating" className="intro-img" />
                            <div className="floating-stat">
                                <h3>100%</h3>
                                <p>Passing Rate in Board Exams</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Curriculum Structure */}
            <section className="curriculum-section">
                <div className="container">
                    <h2 className="section-title">Our Curriculum Structure</h2>
                    <p className="section-subtitle">Tailored educational stages designed for optimal cognitive and social growth.</p>
                    
                    <div className="curriculum-grid">
                        {curriculums.map((curr, index) => (
                            <div className="curriculum-card" key={index} style={{ borderTop: `5px solid ${curr.color}` }}>
                                <div className="curr-icon" style={{ background: `${curr.color}20`, color: curr.color }}>
                                    {curr.icon}
                                </div>
                                <h3>{curr.title}</h3>
                                <p className="curr-desc">{curr.description}</p>
                                
                                <div className="subjects-box">
                                    <h4>Core Subjects</h4>
                                    <ul>
                                        {curr.subjects.map((sub, i) => (
                                            <li key={i}>{sub}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Call to action */}
            <section className="academics-cta">
                <div className="cta-content">
                    <h2>Ready to Join Our Community?</h2>
                    <p>Admissions are now open for the upcoming academic year. Secure your child's future today.</p>
                    <div className="cta-buttons">
                        <Link to="/admissions" className="btn btn-primary">Apply Now</Link>
                        <Link to="/student-fees" className="btn btn-secondary">View Fee Structure</Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Academics;
