import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

const AdminGallery = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const [newPhoto, setNewPhoto] = useState({
        title: '',
        category: 'Events',
        file: null
    });

    const token = localStorage.getItem('adminToken');

    useEffect(() => {
        if (!token) {
            window.location.href = '/admin/login';
            return;
        }
        fetchImages();
    }, [token]);

    const fetchImages = async () => {
        try {
            const response = await fetch('http://localhost:5000/gallery');
            if (!response.ok) throw new Error('Failed to fetch gallery images');
            const data = await response.json();
            setImages(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setNewPhoto({ ...newPhoto, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setNewPhoto({ ...newPhoto, file: e.target.files[0] });
    };

    const handleUploadPhoto = async (e) => {
        e.preventDefault();
        if (!token) return;
        if (!newPhoto.file) {
            alert("Please select an image file to upload.");
            return;
        }

        setIsUploading(true);

        // Use FormData for file uploads
        const formData = new FormData();
        formData.append('title', newPhoto.title);
        formData.append('category', newPhoto.category);
        formData.append('image', newPhoto.file);

        try {
            const response = await fetch('http://localhost:5000/gallery', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Do NOT set Content-Type header with FormData, let the browser boundary it
                },
                body: formData
            });

            if (response.ok) {
                // Reset form
                setNewPhoto({ title: '', category: 'Events', file: null });
                document.getElementById('fileUploadInput').value = ''; // Clear file input UI

                fetchImages(); // Refresh gallery
                alert('Photo uploaded successfully!');
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to upload photo');
            }
        } catch (err) {
            console.error('Error uploading photo:', err);
            alert('Failed to connect to the server.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeletePhoto = async (id) => {
        if (!token) return;
        if (!window.confirm('Are you sure you want to completely delete this physical photo from the server?')) return;

        try {
            const response = await fetch(`http://localhost:5000/gallery/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setImages(images.filter(img => img.id !== id));
            } else {
                alert('Failed to delete photo');
            }
        } catch (err) {
            console.error('Error deleting photo:', err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
    };

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <div className="admin-logo">Admin - Photo Uploads</div>
                <div>
                    <a href="/admin" className="back-link" style={{ marginRight: '20px' }}>Dashboard Home</a>
                    <button onClick={handleLogout} style={{
                        background: 'rgba(255,255,255,0.2)', color: 'var(--bg-white)',
                        border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer',
                        fontWeight: '600', fontSize: '0.9rem', transition: 'background 0.2s'
                    }}>Logout</button>
                </div>
            </header>

            <div className="admin-container">

                {/* Upload Photo Form */}
                <div className="admin-widget" style={{ background: 'white', padding: '25px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                    <h3 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>Upload New Photo</h3>
                    <form onSubmit={handleUploadPhoto} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '20px', alignItems: 'end' }}>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Photo Title</label>
                            <input type="text" name="title" value={newPhoto.title} onChange={handleInputChange} required placeholder="e.g. Science Fair 2026" style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }} />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Category</label>
                            <select name="category" value={newPhoto.category} onChange={handleInputChange} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}>
                                <option value="Events">Events</option>
                                <option value="Campus">Campus</option>
                                <option value="Academics">Academics</option>
                                <option value="Sports">Sports</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Select Image File</label>
                            <input type="file" id="fileUploadInput" accept="image/*" onChange={handleFileChange} required style={{ width: '100%', padding: '7px', borderRadius: '5px', border: '1px solid #ddd', background: '#f9f9f9' }} />
                        </div>

                        <button type="submit" disabled={isUploading} style={{ padding: '12px 25px', background: 'var(--accent-color)', color: 'var(--primary-color)', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', height: '42px' }}>
                            {isUploading ? 'Uploading...' : 'Upload Photo'}
                        </button>
                    </form>
                </div>

                {/* Uploaded Photos Grid */}
                <h3 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>Manage Uploaded Photos</h3>

                {loading && <div>Loading gallery...</div>}
                {error && <div className="error-msg">{error}</div>}

                {!loading && !error && images.length === 0 && (
                    <div style={{ padding: '40px', background: 'white', textAlign: 'center', borderRadius: '10px' }}>No photos have been uploaded yet.</div>
                )}

                {!loading && !error && images.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                        {images.map(image => (
                            <div key={image.id} style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                                <div style={{ height: '180px', overflow: 'hidden', background: '#eee' }}>
                                    <img
                                        src={`http://localhost:5000${image.image_path}`}
                                        alt={image.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                                <div style={{ padding: '15px' }}>
                                    <span style={{ fontSize: '0.8rem', background: '#eef2f6', color: 'var(--primary-color)', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{image.category}</span>
                                    <h4 style={{ margin: '10px 0', fontSize: '1.1rem' }}>{image.title}</h4>
                                    <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '15px' }}>Uploaded: {new Date(image.created_at).toLocaleDateString()}</p>
                                    <button
                                        onClick={() => handleDeletePhoto(image.id)}
                                        style={{ width: '100%', background: '#ff4d4d', color: 'white', border: 'none', padding: '8px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Delete File
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminGallery;
