import React, { useState, useEffect } from 'react';
import './Alumni.css'; // Add styling file for this specific page

const Alumni = () => {
    const [alumni, setAlumni] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        const fetchAlumni = async () => {
            try {
                const response = await fetch('http://localhost:5000/alumni');
                if (response.ok) {
                    const data = await response.json();
                    setAlumni(data);
                }
            } catch (err) {
                console.error('Error fetching alumni:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAlumni();
    }, []);

    return (
        <section className="alumni-section" style={{ padding: '80px 20px', background: '#f9f9f9' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem', color: '#2c3e50', marginBottom: '15px' }}>🎓 Alumni Hall of Fame</h2>
                <p style={{ fontSize: '1.1rem', color: '#666', maxWidth: '700px', margin: '0 auto 50px' }}>
                    Discover the incredible achievements of our past students. From top universities to industry leaders, 
                    see how EduConnect Academy sets the foundation for lifelong success.
                </p>

                {loading ? (
                    <div style={{ fontSize: '1.2rem', color: '#777', padding: '50px 0' }}>Loading success stories...</div>
                ) : alumni.length === 0 ? (
                    <div style={{ fontSize: '1.2rem', color: '#777', padding: '50px 0' }}>No alumni stories have been posted yet. Check back soon!</div>
                ) : (
                    <div className="alumni-grid">
                        {alumni.map(person => (
                            <div key={person.id} className="alumni-card">
                                <div className="alumni-image-wrapper" onClick={() => setSelectedImage(`http://localhost:5000${person.image_path}`)} style={{ cursor: 'pointer' }}>
                                    <img 
                                        src={`http://localhost:5000${person.image_path}`} 
                                        alt={person.name} 
                                        className="alumni-image" 
                                    />
                                    <div className="alumni-batch-badge">
                                        Class of {person.batch_year}
                                    </div>
                                </div>
                                <div className="alumni-details">
                                    <h3 className="alumni-name">{person.name}</h3>
                                    <p className="alumni-position">📍 {person.current_position}</p>
                                    <div className="alumni-divider"></div>
                                    <p className="alumni-achievement">"{person.achievement}"</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div 
                    className="alumni-modal" 
                    onClick={() => setSelectedImage(null)}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                        background: 'rgba(0,0,0,0.85)', zIndex: 2000, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        cursor: 'zoom-out'
                    }}
                >
                    <span style={{ position: 'absolute', top: '20px', right: '30px', color: 'white', fontSize: '2rem', cursor: 'pointer', fontWeight: 'bold' }}>&times;</span>
                    <img cursor="default" src={selectedImage} alt="Expanded Alumni" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', objectFit: 'contain' }} />
                </div>
            )}
        </section>
    );
};

export default Alumni;
