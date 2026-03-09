import React, { useState, useEffect } from 'react';
import './Events.css';

const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch('http://localhost:5000/events');
                if (!response.ok) throw new Error('Failed to fetch events');
                const data = await response.json();
                setEvents(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const formatDate = (dateString) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <section className="events-page py-5">
            <div className="container" style={{ marginTop: '80px' }}>
                <h1 className="section-title text-center mb-5">Upcoming Events & Calendar</h1>

                {loading && <div className="text-center" style={{ fontSize: '1.2rem' }}>Loading events...</div>}
                {error && <div className="alert alert-error">{error}</div>}

                {!loading && !error && events.length === 0 && (
                    <div className="empty-state text-center" style={{ padding: '40px', background: '#f8f9fa', borderRadius: '10px' }}>
                        <h3>No upcoming events currently scheduled.</h3>
                        <p>Please check back later for updates to our academic calendar.</p>
                    </div>
                )}

                <div className="events-grid">
                    {!loading && !error && events.map((event) => (
                        <div key={event.id} className="event-card">
                            <div className="event-date-badge">
                                <span className="month">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                                <span className="day">{new Date(event.date).getDate()}</span>
                            </div>
                            <div className="event-details">
                                <div className="event-type">{event.type}</div>
                                <h3 className="event-title">{event.title}</h3>

                                <ul className="event-meta">
                                    <li><i className="fa-regular fa-calendar"></i> {formatDate(event.date)}</li>
                                    {event.time && <li><i className="fa-regular fa-clock"></i> {event.time}</li>}
                                    {event.location && <li><i className="fa-solid fa-location-dot"></i> {event.location}</li>}
                                </ul>

                                <p className="event-desc">{event.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Events;
