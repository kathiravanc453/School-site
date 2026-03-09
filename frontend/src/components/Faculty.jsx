import React, { useState, useEffect } from 'react';
import './Faculty.css';

const Faculty = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const response = await fetch('http://localhost:5000/teachers');
                if (!response.ok) throw new Error('Failed to fetch faculty data');
                const data = await response.json();
                setTeachers(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTeachers();
    }, []);

    return (
        <section id="faculty" className="faculty-section py-5">
            <div className="container">
                <header className="text-center mb-5">
                    <h2 className="section-title">Our Esteemed Faculty</h2>
                    <p className="faculty-subtitle">
                        Meet the dedicated educators who are committed to shaping the future leaders of tomorrow.
                    </p>
                </header>

                {loading && (
                    <div className="faculty-loading">
                        <div className="spinner"></div>
                        <p>Loading faculty profiles...</p>
                    </div>
                )}

                {error && (
                    <div className="faculty-error">
                        <i className="fas fa-exclamation-circle"></i>
                        <p>{error}</p>
                    </div>
                )}

                {!loading && !error && teachers.length === 0 && (
                    <div className="faculty-empty">
                        <i className="fas fa-users-slash"></i>
                        <p>Our faculty directory is currently being updated. Please check back soon.</p>
                    </div>
                )}

                {!loading && !error && teachers.length > 0 && (
                    <div className="faculty-grid">
                        {teachers.map(teacher => (
                            <div key={teacher.id} className="faculty-card animate-fade-in">
                                <div className="faculty-img-wrapper">
                                    <img
                                        src={teacher.image_url}
                                        alt={teacher.name}
                                        className="faculty-img"
                                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80' }} // Fallback if URL breaks
                                    />
                                </div>
                                <div className="faculty-info">
                                    <h3 className="faculty-name">{teacher.name}</h3>
                                    <p className="faculty-subject">{teacher.subject}</p>
                                    <div className="faculty-divider"></div>
                                    <p className="faculty-qualifications">
                                        <i className="fas fa-graduation-cap"></i> {teacher.qualification}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default Faculty;
