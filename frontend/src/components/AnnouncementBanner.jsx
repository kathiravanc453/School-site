import React, { useState, useEffect } from 'react';

const AnnouncementBanner = () => {
    const [announcement, setAnnouncement] = useState('');
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        const fetchAnnouncement = async () => {
            try {
                const response = await fetch('http://localhost:5000/settings/announcement');
                if (response.ok) {
                    const data = await response.json();
                    setAnnouncement(data.text);
                    setIsActive(data.is_active);
                }
            } catch (err) {
                console.error('Error fetching announcement:', err);
            }
        };

        fetchAnnouncement();
        // Poll every 30 seconds to catch urgent updates without refreshing
        const interval = setInterval(fetchAnnouncement, 30000);
        return () => clearInterval(interval);
    }, []);

    if (!isActive || !announcement) return null;

    return (
        <div className="announcement-wrapper">
            <style>
                {`
                    .announcement-wrapper {
                        position: fixed;
                        top: 85px; /* Positioned below the header */
                        left: 0;
                        width: 100%;
                        overflow: hidden;
                        z-index: 998;
                        background: transparent; /* Removed background */
                        padding: 10px 0;
                        pointer-events: none; /* Let clicks pass through empty space */
                    }
                    .announcement-content {
                        display: inline-block;
                        white-space: nowrap;
                        color: #000000; /* Black text color */
                        font-weight: bold;
                        font-size: 1.2rem;
                        background-color: transparent; /* Made fully transparent */
                        padding: 5px 20px;
                        border-radius: 20px;
                        animation: scrollBanner 20s linear infinite;
                        pointer-events: auto; /* Enable hover on text itself */
                        cursor: default;
                    }
                    .announcement-content:hover {
                        animation-play-state: paused;
                    }
                    @keyframes scrollBanner {
                        0% { transform: translateX(100vw); }
                        100% { transform: translateX(-100%); }
                    }
                `}
            </style>
            <div className="announcement-content">
                <i className="fas fa-bullhorn" style={{ marginRight: '10px', color: '#dc3545' }}></i>
                {announcement}
            </div>
        </div>
    );
};

export default AnnouncementBanner;
