import React from 'react';
import './Facilities.css';

const facilitiesData = [
    { id: 1, icon: '🚌', title: 'Transport (GPS)', desc: 'Safe and secure monitored transport fleet.' },
    { id: 2, icon: '🧪', title: 'Laboratories', desc: 'State-of-the-art science and computer labs.' },
    { id: 3, icon: '💻', title: 'Digital Classrooms', desc: 'Smart boards and digital learning tools.' },
    { id: 4, icon: '🍽️', title: 'Meal Plan', desc: 'Nutritious and hygienic meals provided daily.' },
    { id: 5, icon: '🎨', title: 'Co-curricular Activities', desc: 'Clubs for arts, music, dance, and drama.' },
    { id: 6, icon: '🤖', title: 'Robotics Lab', desc: 'Advanced STEM learning and robotics kits.' },
];

const Facilities = () => {
    return (
        <section id="facilities" className="facilities-section py-5">
            <div className="container">
                <h2 className="section-title">Our World-Class Facilities</h2>
                <div className="facilities-grid">
                    {facilitiesData.map((facility) => (
                        <div key={facility.id} className="facility-card">
                            <div className="facility-icon">{facility.icon}</div>
                            <h3 className="facility-title">{facility.title}</h3>
                            <p className="facility-desc">{facility.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Facilities;
