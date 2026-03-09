import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

const AdminTeachers = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [newTeacher, setNewTeacher] = useState({
        name: '',
        subject: '',
        qualification: '',
        image_url: ''
    });

    const token = localStorage.getItem('adminToken');

    useEffect(() => {
        if (!token) {
            window.location.href = '/admin/login';
            return;
        }
        fetchTeachers();
    }, [token]);

    const fetchTeachers = async () => {
        try {
            const response = await fetch('http://localhost:5000/teachers');
            if (!response.ok) throw new Error('Failed to fetch teachers');
            const data = await response.json();
            setTeachers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setNewTeacher({ ...newTeacher, [e.target.name]: e.target.value });
    };

    const handleCreateTeacher = async (e) => {
        e.preventDefault();
        if (!token) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('http://localhost:5000/teachers', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newTeacher)
            });

            if (response.ok) {
                setNewTeacher({ name: '', subject: '', qualification: '', image_url: '' });
                fetchTeachers(); // Refresh list
                alert('Teacher profile added successfully!');
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to add teacher');
            }
        } catch (err) {
            console.error('Error creating teacher:', err);
            alert('Failed to connect to the server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTeacher = async (id) => {
        if (!token) return;
        if (!window.confirm('Are you sure you want to remove this teacher from the directory?')) return;

        try {
            const response = await fetch(`http://localhost:5000/teachers/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setTeachers(teachers.filter(t => t.id !== id));
            } else {
                alert('Failed to delete teacher');
            }
        } catch (err) {
            console.error('Error deleting teacher:', err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
    };

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <div className="admin-logo">Admin - Manage Faculty</div>
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

                {/* Create Teacher Form */}
                <div className="admin-card" style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>Add New Faculty Member</h3>
                    <form onSubmit={handleCreateTeacher}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Full Name *</label>
                            <input type="text" name="name" value={newTeacher.name} onChange={handleInputChange} required placeholder="Dr. Jane Smith" style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }} />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Subject / Department *</label>
                            <input type="text" name="subject" value={newTeacher.subject} onChange={handleInputChange} required placeholder="Mathematics" style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }} />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Qualifications *</label>
                            <input type="text" name="qualification" value={newTeacher.qualification} onChange={handleInputChange} required placeholder="Ph.D. in Applied Mathematics" style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }} />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Profile Image URL (Optional)</label>
                            <input type="url" name="image_url" value={newTeacher.image_url} onChange={handleInputChange} placeholder="https://example.com/photo.jpg" style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }} />
                            <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>Leave blank to use a default placeholder image.</small>
                        </div>

                        <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: '12px', background: 'var(--accent-color)', color: 'var(--primary-color)', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                            {isSubmitting ? 'Adding...' : 'Add Teacher'}
                        </button>
                    </form>
                </div>

                {/* Teachers List */}
                <div className="admin-card" style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>Current Faculty Directory</h3>

                    {loading && <div>Loading faculty...</div>}
                    {error && <div className="error-msg">{error}</div>}

                    {!loading && !error && teachers.length === 0 && (
                        <div style={{ padding: '20px', background: '#f9f9f9', textAlign: 'center', borderRadius: '5px' }}>No teachers in the directory yet.</div>
                    )}

                    {!loading && !error && teachers.length > 0 && (
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Photo</th>
                                        <th>Name</th>
                                        <th>Subject</th>
                                        <th>Qualifications</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teachers.map(teacher => (
                                        <tr key={teacher.id}>
                                            <td>
                                                <img src={teacher.image_url} alt={teacher.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                            </td>
                                            <td><strong>{teacher.name}</strong></td>
                                            <td>{teacher.subject}</td>
                                            <td><span style={{ color: '#555', fontSize: '0.9rem' }}>{teacher.qualification}</span></td>
                                            <td>
                                                <button
                                                    onClick={() => handleDeleteTeacher(teacher.id)}
                                                    style={{ background: '#ff4d4d', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}
                                                >
                                                    Remove
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

export default AdminTeachers;
