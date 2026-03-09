import React, { useState, useEffect } from 'react';
import './Achievements.css';

// Generating array of 30 images using placeholders or Unsplash source
const achievementImages = Array.from({ length: 30 }, (_, i) =>
    `https://images.unsplash.com/photo-1596496181848-3091d4878b24?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&sig=${i}`
);

const Achievements = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-play the slider every 2 seconds
    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentIndex((prevIndex) =>
                prevIndex === achievementImages.length - 1 ? 0 : prevIndex + 1
            );
        }, 2000);

        return () => clearInterval(intervalId); // Cleanup interval on unmount
    }, []);

    // Manual controls
    const handleNext = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === achievementImages.length - 1 ? 0 : prevIndex + 1
        );
    };

    const handlePrev = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? achievementImages.length - 1 : prevIndex - 1
        );
    };

    const handleDotClick = (index) => {
        setCurrentIndex(index);
    };

    return (
        <section className="achievements-section py-5">
            <div className="container">
                <div className="achievements-header text-center">
                    <h2 className="section-title">Our Achievements</h2>
                    <p>Celebrating excellence, milestones, and the proud moments of our students.</p>
                </div>

                <div className="slider-wrapper">
                    <div className="slider-container">
                        <div
                            className="slider-track"
                            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                        >
                            {achievementImages.map((img, index) => (
                                <div className="slide" key={index}>
                                    <img src={img} alt={`Achievement ${index + 1}`} />
                                    <div className="slide-caption">
                                        <h3>Achievement #{index + 1}</h3>
                                        <p>Outstanding student excellence award.</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Manual Navigation Controls */}
                    <button className="slider-btn prev-btn" onClick={handlePrev} aria-label="Previous image">
                        <i className="fa-solid fa-chevron-left"></i>
                    </button>
                    <button className="slider-btn next-btn" onClick={handleNext} aria-label="Next image">
                        <i className="fa-solid fa-chevron-right"></i>
                    </button>

                    {/* Slider Indicator Dots */}
                    <div className="slider-dots">
                        {achievementImages.map((_, index) => (
                            <button
                                key={index}
                                className={`dot ${index === currentIndex ? 'active' : ''}`}
                                onClick={() => handleDotClick(index)}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Achievements;
