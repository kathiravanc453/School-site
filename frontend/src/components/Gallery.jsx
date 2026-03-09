import React, { useState, useEffect } from 'react';
import './Gallery.css';

const Gallery = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const response = await fetch('http://localhost:5000/gallery');
                if (!response.ok) throw new Error('Failed to load gallery');
                const data = await response.json();
                setImages(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchGallery();
    }, []);
    const [sliderOpen, setSliderOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const openSlider = (index) => {
        setCurrentIndex(index);
        setSliderOpen(true);
        document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    };

    const closeSlider = () => {
        setSliderOpen(false);
        document.body.style.overflow = 'auto'; // Restore scrolling
    };

    const filteredImages = filter === 'All'
        ? images
        : images.filter(img => img.category === filter);

    const nextImage = (e) => {
        e.stopPropagation(); // Prevent modal from closing
        setCurrentIndex((prevIndex) => (prevIndex === filteredImages.length - 1 ? 0 : prevIndex + 1));
    };

    const prevImage = (e) => {
        e.stopPropagation(); // Prevent modal from closing
        setCurrentIndex((prevIndex) => (prevIndex === 0 ? filteredImages.length - 1 : prevIndex - 1));
    };

    return (
        <section id="gallery" className="gallery-section py-5">
            <div className="container">
                <h2 className="section-title">Campus Life & Gallery</h2>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px' }}>
                    {['All', 'Events', 'Campus', 'Academics', 'Sports'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            style={{
                                padding: '8px 20px',
                                border: 'none',
                                borderRadius: '20px',
                                background: filter === cat ? 'var(--accent-color)' : '#eee',
                                color: filter === cat ? 'var(--primary-color)' : '#333',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {loading && <div style={{ textAlign: 'center', padding: '40px' }}>Loading photos...</div>}
                {error && <div style={{ textAlign: 'center', color: 'red', padding: '40px' }}>{error}</div>}

                {!loading && !error && filteredImages.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', background: '#f9f9f9', borderRadius: '10px' }}>
                        No photos available in this category yet.
                    </div>
                )}

                <div className="gallery-grid">
                    {filteredImages.map((img, index) => (
                        <div
                            key={img.id}
                            className="gallery-item"
                            onClick={() => openSlider(index)}
                        >
                            <img src={`http://localhost:5000${img.image_path}`} alt={img.title} />
                            <div className="gallery-overlay">
                                <span>{img.title}</span> {/* Overlay now shows the actual title */}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lightbox Slider */}
            {sliderOpen && (
                <div className="lightbox-overlay" onClick={closeSlider}>
                    <button className="lightbox-close" onClick={closeSlider}>&times;</button>

                    <button className="lightbox-nav lightbox-prev" onClick={prevImage}>
                        &#10094;
                    </button>

                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={`http://localhost:5000${filteredImages[currentIndex]?.image_path}`}
                            alt={filteredImages[currentIndex]?.title}
                            className="lightbox-image"
                        />
                        <div className="lightbox-caption">
                            {filteredImages[currentIndex]?.title} ({currentIndex + 1} of {filteredImages.length})
                        </div>
                    </div>

                    <button className="lightbox-nav lightbox-next" onClick={nextImage}>
                        &#10095;
                    </button>
                </div>
            )}
        </section>
    );
};

export default Gallery;
