import React from 'react';
import './Facilities.css';

const facilitiesData = [
    { 
        id: 1, 
        icon: '🚌', 
        image: 'https://images.unsplash.com/photo-1557223562-6c77ef1607bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        title: 'Transport (GPS Tracked)', 
        desc: 'Our fleet of modern buses covers all major routes. Fully equipped with GPS tracking, CCTV, and trained attendants to ensure complete safety.' 
    },
    { 
        id: 2, 
        icon: '🧪', 
        image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        title: 'Advanced Laboratories', 
        desc: 'Dedicated state-of-the-art Physics, Chemistry, Biology, and Computer Science labs providing hands-on practical experience for all grades.' 
    },
    { 
        id: 3, 
        icon: '💻', 
        image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        title: 'Digital Smart Classrooms', 
        desc: 'Fully air-conditioned classrooms integrated with smart interactive boards, projectors, and high-speed internet for dynamic learning.' 
    },
    { 
        id: 4, 
        icon: '📚', 
        image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        title: 'Central Library', 
        desc: 'A vast collection of academic books, international journals, encyclopedias, and digital resources in a quiet, conducive reading environment.' 
    },
    { 
        id: 5, 
        icon: '⚽', 
        image: 'https://images.unsplash.com/photo-1526676037777-05a232554f77?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        title: 'Sports Complex', 
        desc: 'Expansive playgrounds featuring basketball courts, a football field, indoor badminton, and dedicated coaches for athletic excellence.' 
    },
    { 
        id: 6, 
        icon: '🎨', 
        image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        title: 'Arts & Music Studios', 
        desc: 'Creative spaces designed to foster talent in painting, classical and modern music, dance, and theatrical performances.' 
    },
];

const Facilities = () => {
    return (
        <section id="facilities" className="facilities-section">
            <div className="container">
                <h2 className="section-title">World-Class Infrastructure</h2>
                <p className="facilities-subtitle">
                    We believe that the physical environment deeply impacts learning. Our campus is meticulously designed to provide students with the best resources to explore, create, and grow.
                </p>
                
                <div className="facilities-grid">
                    {facilitiesData.map((facility) => (
                        <div key={facility.id} className="facility-card">
                            <div className="facility-img-container">
                                <img src={facility.image} alt={facility.title} />
                                <div className="facility-icon-badge">{facility.icon}</div>
                            </div>
                            <div className="facility-content">
                                <h3 className="facility-title">{facility.title}</h3>
                                <p className="facility-desc">{facility.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="facilities-highlight">
                    <div className="highlight-content">
                        <h3>Safe, Secure & Inspiring</h3>
                        <p>Our campus is monitored 24/7 with advanced CCTV networks and trained security personnel. We maintain a zero-tolerance policy for bullying, creating a safe haven for intellectual and emotional growth.</p>
                        <div className="highlight-stats">
                            <div className="stat-item">
                                <h4>15+</h4>
                                <p>Acres Campus</p>
                            </div>
                            <div className="stat-item">
                                <h4>24/7</h4>
                                <p>Security</p>
                            </div>
                            <div className="stat-item">
                                <h4>100%</h4>
                                <p>Power Backup</p>
                            </div>
                        </div>
                    </div>
                    <div className="highlight-image"></div>
                </div>
            </div>
        </section>
    );
};

export default Facilities;
