import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

const AdminEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [newEvent, setNewEvent] = useState({
        title: '',
        date: '',
        time: '',
        location: '',
        description: '',
        type: 'General'
    });

    const token = localStorage.getItem('adminToken');

    useEffect(() => {
        if (!token) {
            window.location.href = '/admin/login';
            return;
        }
        fetchEvents();
    }, [token]);

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

    const handleInputChange = (e) => {
        setNewEvent({ ...newEvent, [e.target.name]: e.target.value });
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        if (!token) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('http://localhost:5000/events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newEvent)
            });

            if (response.ok) {
                setNewEvent({ title: '', date: '', time: '', location: '', description: '', type: 'General' });
                fetchEvents(); // Refresh list
                alert('Event created successfully!');
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to create event');
            }
        } catch (err) {
            console.error('Error creating event:', err);
            alert('Failed to connect to the server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteEvent = async (id) => {
        if (!token) return;
        if (!window.confirm('Are you sure you want to delete this event?')) return;

        try {
            const response = await fetch(`http://localhost:5000/events/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setEvents(events.filter(e => e.id !== id));
            } else {
                alert('Failed to delete event');
            }
        } catch (err) {
            console.error('Error deleting event:', err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
    };

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <div className="admin-logo">Admin - Manage Events</div>
                <div>
                    <a href="/admin" className="back-link" style={{ marginRight: '20px' }}>Dashboard Home</a>
                    <button onClick={handleLogout} style={{
                        background: 'rgba(255,255,255,0.2)', color: 'var(--bg-white)',
                        border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer',
                        fontWeight: '600', fontSize: '0.9rem', transition: 'background 0.2s'
                    }}>Logout</button>
                </div>
            </header>

            <div className="admin-container" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>

                {/* Create Event Form */}
                <div className="admin-card" style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>Create New Event</h3>
                    <form onSubmit={handleCreateEvent}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Event Title *</label>
                            <input type="text" name="title" value={newEvent.title} onChange={handleInputChange} required style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date *</label>
                                <input type="date" name="date" value={newEvent.date} onChange={handleInputChange} max="9999-12-31" required style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Time</label>
                                <input type="time" name="time" value={newEvent.time} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }} />
                            </div>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Location</label>
                            <input type="text" name="location" value={newEvent.location} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }} />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Event Type</label>
                            <select name="type" value={newEvent.type} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}>
                                <option value="General">General</option>
                                <option value="Academic">Academic</option>
                                <option value="Sports">Sports</option>
                                <option value="Cultural">Cultural</option>
                                <option value="Holiday">Holiday</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description</label>
                            <textarea name="description" value={newEvent.description} onChange={handleInputChange} rows="4" style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd', resize: 'vertical' }}></textarea>
                        </div>

                        <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: '12px', background: 'var(--accent-color)', color: 'var(--primary-color)', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                            {isSubmitting ? 'Creating...' : 'Create Event'}
                        </button>
                    </form>
                </div>

                {/* Events List */}
                <div className="admin-card" style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>Manage Existing Events</h3>

                    {loading && <div>Loading events...</div>}
                    {error && <div className="error-msg">{error}</div>}

                    {!loading && !error && events.length === 0 && (
                        <div style={{ padding: '20px', background: '#f9f9f9', textAlign: 'center', borderRadius: '5px' }}>No events found.</div>
                    )}

                    {!loading && !error && events.length > 0 && (
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Title</th>
                                        <th>Type</th>
                                        <th>Location</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map(event => (
                                        <tr key={event.id}>
                                            <td style={{ whiteSpace: 'nowrap' }}>{new Date(event.date).toLocaleDateString()}</td>
                                            <td><strong>{event.title}</strong></td>
                                            <td><span className="badge" style={{ background: '#eee', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{event.type}</span></td>
                                            <td>{event.location}</td>
                                            <td>
                                                <button
                                                    onClick={() => handleDeleteEvent(event.id)}
                                                    style={{ background: '#ff4d4d', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminEvents;
