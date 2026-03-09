import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

const AdminAlumni = () => {
    const [alumni, setAlumni] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form States
    const [name, setName] = useState('');
    const [batchYear, setBatchYear] = useState('');
    const [achievement, setAchievement] = useState('');
    const [currentPosition, setCurrentPosition] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const token = localStorage.getItem('adminToken');

    useEffect(() => {
        if (!token) {
            window.location.href = '/admin/login';
            return;
        }
        fetchAlumni();
    }, [token]);

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

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!name || !batchYear || !achievement || !image) {
            alert('Please fill all required fields and select an image.');
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('name', name);
        formData.append('batch_year', batchYear);
        formData.append('achievement', achievement);
        formData.append('current_position', currentPosition);
        formData.append('image', image);

        try {
            const response = await fetch('http://localhost:5000/admin/alumni', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                alert('Alumni profile added successfully!');
                fetchAlumni();
                setName('');
                setBatchYear('');
                setAchievement('');
                setCurrentPosition('');
                setImage(null);
                setImagePreview(null);
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to add alumni');
            }
        } catch (error) {
            alert('Error adding alumni profile');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this alumni profile?")) return;

        try {
            const response = await fetch(`http://localhost:5000/admin/alumni/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                fetchAlumni();
            } else {
                alert('Failed to delete profile');
            }
        } catch (error) {
            alert('Error deleting profile');
        }
    };

    return (
        <div className="admin-dashboard">
             <header className="admin-header">
                <div className="admin-logo">Alumni Directory Admin</div>
                <div>
                    <a href="/admin" className="back-link" style={{ marginRight: '15px' }}>← Back to Dashboard</a>
                    <button onClick={() => { localStorage.removeItem('adminToken'); window.location.href = '/admin/login'; }} className="btn" style={{background: 'rgba(255,255,255,0.2)'}}>
                        Logout
                    </button>
                </div>
            </header>

            <div className="admin-container">
                <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                    <h3 style={{ marginTop: 0, color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px', display: 'inline-block' }}>➕ Add New Alumni Success Story</h3>
                    <form onSubmit={handleUpload} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                        
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Alumni Name *</label>
                            <input 
                                type="text" value={name} onChange={(e) => setName(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                required placeholder="e.g. Sundar Pichai"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Batch Year (Graduation) *</label>
                            <input 
                                type="number" value={batchYear} onChange={(e) => setBatchYear(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                required placeholder="e.g. 2015" min="1950" max="2100"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Current Position / University *</label>
                            <input 
                                type="text" value={currentPosition} onChange={(e) => setCurrentPosition(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                required placeholder="e.g. Software Engineer at Google"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Summary of Achievement *</label>
                            <input 
                                type="text" value={achievement} onChange={(e) => setAchievement(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                required placeholder="e.g. Accepted into MIT with full scholarship"
                            />
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Profile Photo *</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <input 
                                    type="file" accept="image/*" onChange={handleImageChange}
                                    style={{ padding: '10px', border: '1px dashed #3498db', borderRadius: '6px', background: '#f8fbff', width: '100%' }}
                                    required
                                />
                                {imagePreview && (
                                    <img src={imagePreview} alt="Preview" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', border: '2px solid #3498db' }} />
                                )}
                            </div>
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <button type="submit" disabled={isSubmitting} style={{ background: '#3498db', color: 'white', padding: '12px 25px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                                {isSubmitting ? 'Uploading Profile...' : 'Upload Success Story'}
                            </button>
                        </div>
                    </form>
                </div>

                <h3 style={{ color: '#2c3e50', marginBottom: '20px' }}>Current Hall of Fame</h3>
                {loading ? (
                    <div className="loader">Loading alumni records...</div>
                ) : alumni.length === 0 ? (
                    <div className="empty-state">No alumni records found. Upload one above!</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                        {alumni.map(person => (
                            <div key={person.id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', position: 'relative' }}>
                                <button 
                                    onClick={() => handleDelete(person.id)}
                                    style={{ position: 'absolute', top: '10px', right: '10px', background: '#e74c3c', color: 'white', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', zIndex: 10 }}
                                    title="Delete Profile"
                                >
                                    ✕
                                </button>
                                <img 
                                    src={`http://localhost:5000${person.image_path}`} 
                                    alt={person.name} 
                                    style={{ width: '100%', height: '200px', objectFit: 'cover' }} 
                                />
                                <div style={{ padding: '20px', textAlign: 'center' }}>
                                    <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50', fontSize: '1.2rem' }}>{person.name}</h4>
                                    <span style={{ display: 'inline-block', background: '#f1c40f', color: '#8e44ad', fontWeight: 'bold', padding: '3px 10px', borderRadius: '15px', fontSize: '0.8rem', marginBottom: '10px' }}>
                                        Class of {person.batch_year}
                                    </span>
                                    <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#666', fontWeight: 'bold' }}>{person.currentPosition}</p>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#777', fontStyle: 'italic' }}>"{person.achievement}"</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAlumni;
