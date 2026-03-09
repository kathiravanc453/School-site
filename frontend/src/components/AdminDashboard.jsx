import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [students, setStudents] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Announcement State
    const [announcement, setAnnouncement] = useState('');
    const [isAnnouncementActive, setIsAnnouncementActive] = useState(false);
    const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
    
    // Toast State
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);

    const token = localStorage.getItem('adminToken');

    const fetchStudents = async () => {
        if (!token) return;
        try {
            const response = await fetch('http://localhost:5000/students', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 401 || response.status === 403) {
                handleLogout();
                return;
            }
            if (!response.ok) throw new Error('Failed to fetch data');
            const data = await response.json();
            setStudents(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchAlerts = async () => {
        if (!token) return;
        try {
            const response = await fetch('http://localhost:5000/admin/alerts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.unreadCount);
            }
        } catch (err) {
            console.error('Error fetching alerts:', err);
        }
    };

    const fetchAnnouncement = async () => {
        try {
            const response = await fetch('http://localhost:5000/settings/announcement');
            if (response.ok) {
                const data = await response.json();
                setAnnouncement(data.text || '');
                setIsAnnouncementActive(data.is_active || false);
            }
        } catch (err) {
            console.error('Error fetching announcement:', err);
        }
    };

    const handleAnnouncementSave = async (activeState) => {
        if (!token) return;
        setIsSavingAnnouncement(true);
        try {
            const response = await fetch('http://localhost:5000/settings/announcement', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: announcement, is_active: activeState })
            });
            if (response.ok) {
                setIsAnnouncementActive(activeState);
                
                if (activeState) {
                    // Show success toast for activation
                    setToastMessage('✅ Announcement Published! SMS notifications are being sent to students.');
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 4000);
                } else {
                     // Show success toast for deactivation
                    setToastMessage('🛑 Announcement Deactivated successfully.');
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 4000);
                }
            } else {
                alert('Failed to update announcement');
            }
        } catch (err) {
            console.error('Error saving announcement:', err);
        } finally {
            setIsSavingAnnouncement(false);
        }
    };

    const markAsRead = async (id) => {
        if (!token) return;
        try {
            const response = await fetch(`http://localhost:5000/admin/mark-read/${id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setStudents(students.map(s => s.id === id ? { ...s, status: 'read' } : s));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const updateApplicationStage = async (id, stage) => {
        if (!token) return;
        try {
            const response = await fetch(`http://localhost:5000/admin/application-stage/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ stage })
            });
            if (response.ok) {
                setStudents(students.map(s => s.id === id ? { ...s, application_stage: stage } : s));
            } else {
                alert('Failed to update stage');
            }
        } catch (err) {
            console.error('Error updating stage:', err);
        }
    };

    useEffect(() => {
        if (!token) {
            window.location.href = '/admin/login';
            return;
        }

        // Initial fetch
        fetchStudents();
        fetchAlerts();
        fetchAnnouncement();

        // Polling every 15 seconds for new alerts
        const intervalId = setInterval(() => {
            fetchStudents(); // Optionally fetch all students or just alerts
            fetchAlerts();
        }, 15000);

        return () => clearInterval(intervalId);
    }, [token]);

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
    };

    const exportToPDF = () => {
        if (students.length === 0) return;
        
        const doc = new jsPDF();
        
        // Add Title
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text("Student Applications Report", 14, 22);
        
        // Add Date generated
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        // Prep data
        const tableColumn = ["ID", "Name", "Phone", "Grade applying for", "Application Stage", "Date Applied"];
        const tableRows = [];

        filteredStudents.forEach(s => {
            const studentData = [
                `#${s.id}`,
                s.name,
                s.phone,
                s.grade,
                s.application_stage,
                new Date(s.created_at).toLocaleDateString()
            ];
            tableRows.push(studentData);
        });

        // Add autoTable
        autoTable(doc, {
            startY: 35,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [0, 86, 179] }, // Brand blue
            alternateRowStyles: { fillColor: [248, 249, 250] },
            margin: { top: 35 }
        });

        // Download
        doc.save('student_applications.pdf');
    };

    const filteredStudents = students.filter(student => {
        const term = searchTerm.toLowerCase();
        return (
            (student.name && student.name.toLowerCase().includes(term)) ||
            (student.tracking_id && String(student.tracking_id).toLowerCase().includes(term)) ||
            (student.phone && String(student.phone).includes(term)) ||
            (student.email && student.email.toLowerCase().includes(term))
        );
    });

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <div className="admin-logo">
                    Admin Dashboard
                    {unreadCount > 0 && <span className="alert-badge">{unreadCount}</span>}
                </div>
                <div>
                    <a href="/" className="back-link" style={{ marginRight: '15px' }}>← Back to Website</a>
                    <a href="/admin/messages" className="back-link" style={{ marginRight: '15px', background: '#0056b3', color: 'white', padding: '5px 10px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>💬 Direct SMS</a>
                    <a href="/admin/fees" className="back-link" style={{ marginRight: '15px', background: '#27ae60', color: 'white', padding: '5px 10px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>💳 Fees</a>
                    <a href="/admin/alumni" className="back-link" style={{ marginRight: '15px', background: '#d35400', color: 'white', padding: '5px 10px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>🎓 Alumni</a>
                    <a href="/admin/events" className="back-link" style={{ marginRight: '15px', background: 'var(--accent-color)', color: 'var(--primary-color)', padding: '5px 10px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>🗓️ Events</a>
                    <a href="/admin/teachers" className="back-link" style={{ marginRight: '15px', background: 'var(--accent-color)', color: 'var(--primary-color)', padding: '5px 10px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>👩‍🏫 Faculty</a>
                    <a href="/admin/gallery" className="back-link" style={{ marginRight: '20px', background: 'var(--accent-color)', color: 'var(--primary-color)', padding: '5px 10px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>📸 Gallery</a>
                    <button onClick={handleLogout} style={{
                        background: 'rgba(255,255,255,0.2)', color: 'var(--bg-white)',
                        border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer',
                        fontWeight: '600', fontSize: '0.9rem', transition: 'background 0.2s'
                    }}>Logout</button>
                </div>
            </header>

            <div className="admin-container">
                {/* Announcement Widget */}
                <div className="admin-widget" style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px', borderLeft: '4px solid var(--accent-color)' }}>
                    <h3 style={{ color: 'var(--primary-color)', marginBottom: '15px' }}>Global Announcement Banner</h3>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>This message will appear prominently at the top of the entire website when activated. Use it for sudden holidays or emergencies.</p>
                    <textarea
                        value={announcement}
                        onChange={(e) => setAnnouncement(e.target.value)}
                        placeholder="Enter announcement text here (e.g. 'School is closed tomorrow due to heavy rain.')"
                        style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd', minHeight: '80px', marginBottom: '15px', resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button
                            onClick={() => handleAnnouncementSave(true)}
                            disabled={isSavingAnnouncement || isAnnouncementActive}
                            style={{ padding: '8px 20px', background: isAnnouncementActive ? '#ccc' : '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: isAnnouncementActive ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                        >
                            {isSavingAnnouncement && isAnnouncementActive ? 'Activating...' : 'Activate Banner'}
                        </button>
                        <button
                            onClick={() => handleAnnouncementSave(false)}
                            disabled={isSavingAnnouncement || !isAnnouncementActive}
                            style={{ padding: '8px 20px', background: !isAnnouncementActive ? '#ccc' : '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: !isAnnouncementActive ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                        >
                            {isSavingAnnouncement && !isAnnouncementActive ? 'Deactivating...' : 'Deactivate Banner'}
                        </button>
                        {isAnnouncementActive && (
                            <span style={{ display: 'flex', alignItems: 'center', color: '#28a745', fontWeight: 'bold' }}>
                                <i className="fas fa-check-circle" style={{ marginRight: '5px' }}></i> Banner is currently LIVE
                            </span>
                        )}
                    </div>
                </div>

                {/* Dashboard Analytics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderBottom: '4px solid #0056b3' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#666' }}>Total Applications</h4>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>{students.length}</div>
                    </div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderBottom: '4px solid #28a745' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#666' }}>Accepted Students</h4>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745' }}>
                            {students.filter(s => s.application_stage === 'Accepted').length}
                        </div>
                    </div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderBottom: '4px solid #ffc107' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#666' }}>Pending Review</h4>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>
                            {students.filter(s => s.application_stage === 'Submitted' || s.application_stage === 'Under Review').length}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h2>Student Applications {unreadCount > 0 && <span className="unread-text">({unreadCount} new)</span>}</h2>
                    
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <input 
                            type="text" 
                            placeholder="🔍 Search name, phone, email..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '8px 15px', borderRadius: '20px', border: '1px solid #ccc', outline: 'none', width: '250px' }}
                        />
                        <button 
                            onClick={exportToPDF}
                            style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}
                            title="Download as PDF"
                        >
                            📄 Download PDF Report
                        </button>
                    </div>
                </div>

                {loading && <div className="loader">Loading...</div>}
                {error && <div className="error-msg">{error}</div>}

                {!loading && !error && students.length === 0 && (
                    <div className="empty-state">No applications found yet.</div>
                )}

                {!loading && !error && students.length > 0 && (
                    <div className="table-responsive">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID / Tracking ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone Number</th>
                                    <th>Grade applying for</th>
                                    <th>Date Applied</th>
                                    <th>Application Stage</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.length > 0 ? filteredStudents.map(student => (
                                    <tr key={student.id} className={student.status === 'unread' ? 'unread-row' : ''}>
                                        <td>
                                            <strong>#{student.id}</strong><br />
                                            <small style={{ color: '#888' }}>{student.tracking_id}</small>
                                        </td>
                                        <td>{student.name}</td>
                                        <td>{student.email || '-'}</td>
                                        <td>
                                            {student.phone}
                                            <button 
                                                onClick={() => { navigator.clipboard.writeText(student.phone); setToastMessage('📋 Phone number copied!'); setShowToast(true); setTimeout(() => setShowToast(false), 2000); }}
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', marginLeft: '5px', fontSize: '1rem' }}
                                                title="Copy Phone Number"
                                            >
                                                📑
                                            </button>
                                        </td>
                                        <td>{student.grade}</td>
                                        <td>{new Date(student.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <select
                                                value={student.application_stage || 'Submitted'}
                                                onChange={(e) => updateApplicationStage(student.id, e.target.value)}
                                                className="stage-select"
                                                style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                                            >
                                                <option value="Submitted">Submitted</option>
                                                <option value="Under Review">Under Review</option>
                                                <option value="Interview Scheduled">Interview Scheduled</option>
                                                <option value="Accepted">Accepted</option>
                                                <option value="Rejected">Rejected</option>
                                            </select>
                                        </td>
                                        <td>
                                            {student.status === 'unread' ? (
                                                <button
                                                    className="btn-mark-read"
                                                    onClick={() => markAsRead(student.id)}
                                                >
                                                    Mark Read
                                                </button>
                                            ) : (
                                                <span className="text-muted">Read</span>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="8" style={{textAlign: 'center', padding: '20px'}}>No students match your search filter.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            {/* Custom Toast Notification */}
            {showToast && (
                <div style={{
                    position: 'fixed',
                    bottom: '30px',
                    right: '30px',
                    background: 'var(--primary-color)',
                    color: 'white',
                    padding: '16px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    zIndex: 9999,
                    animation: 'slideIn 0.3s ease-out forwards',
                    fontWeight: 'bold'
                }}>
                    {toastMessage}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
