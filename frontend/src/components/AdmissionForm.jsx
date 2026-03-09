import React, { useState } from 'react';
import './AdmissionForm.css';

const AdmissionForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        grade: '',
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [trackingId, setTrackingId] = useState(null);
    const [trackingInput, setTrackingInput] = useState('');
    const [trackingResult, setTrackingResult] = useState(null);
    const [trackingError, setTrackingError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Enforce numeric only for phone numbers and max length of 10
        if (name === 'phone') {
            const numericValue = value.replace(/[^0-9]/g, '').slice(0, 10);
            setFormData({ ...formData, phone: numericValue });
            return;
        }

        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus({ type: '', message: '' });

        // Validate Phone Number Length
        if (formData.phone.length !== 10) {
            setStatus({ type: 'error', message: 'Please enter a valid 10-digit phone number.' });
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({ type: 'success', message: 'Application submitted successfully! Please save your tracking ID below.' });
                setTrackingId(data.trackingId);
                setFormData({ name: '', email: '', phone: '', grade: '' }); // Reset form
            } else {
                setStatus({ type: 'error', message: data.error || 'Something went wrong. Please try again.' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Failed to connect to the server. Please try again later.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTrackSubmit = async (e) => {
        e.preventDefault();
        setTrackingError('');
        setTrackingResult(null);

        if (!trackingInput.trim()) {
            setTrackingError('Please enter a tracking ID.');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/admissions/track/${trackingInput.trim()}`);
            const data = await response.json();

            if (response.ok) {
                setTrackingResult(data);
            } else {
                setTrackingError(data.error || 'Invalid tracking ID.');
            }
        } catch (error) {
            setTrackingError('Failed to connect to the server.');
        }
    };

    return (
        <section id="admissions" className="admission-section py-5">
            <div className="container">
                <div className="form-wrapper">
                    <div className="form-content">
                        <h2 className="section-title" style={{ textAlign: 'left', margin: '0 0 20px 0' }}>Join Our Family</h2>
                        <p className="form-subtitle">Take the first step towards a brilliant future. Admissions open for the academic year 2026-27.</p>

                        {status.message && (
                            <div className={`alert alert-${status.type}`}>
                                {status.message}
                                {status.type === 'success' && trackingId && (
                                    <div className="tracking-id-display mt-3">
                                        <strong>Your Tracking ID: </strong>
                                        <span className="badge badge-primary" style={{ fontSize: '1.2rem', padding: '5px 10px', background: 'var(--accent-color)', color: 'var(--primary-color)' }}>{trackingId}</span>
                                        <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>Save this ID to track your application status.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="admission-form">
                            <div className="form-group">
                                <label htmlFor="name">Student Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email Address (Optional)</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter email address (Optional)"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone">Phone Number <span style={{fontSize: '0.8rem', color: '#666', fontWeight:'normal'}}>(10 digits required for notifications)</span></label>
                                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '5px', overflow: 'hidden', paddingLeft: '10px', background: '#f8f9fa' }}>
                                    <span style={{ color: '#555', fontWeight: 'bold', marginRight: '5px' }}>+91</span>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        style={{ border: 'none', borderRadius: '0', flex: 1, padding: '10px' }}
                                        value={formData.phone}
                                        onChange={handleChange}
                                        pattern="[0-9]{10}"
                                        maxLength="10"
                                        required
                                        placeholder="Enter 10-digit mobile number"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="grade">Applying for Grade</label>
                                <select
                                    id="grade"
                                    name="grade"
                                    value={formData.grade}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="" disabled>Select a grade</option>
                                    <option value="Pre-KG">Pre-KG</option>
                                    <option value="LKG">LKG</option>
                                    <option value="UKG">UKG</option>
                                    <option value="Grade 1">Grade 1</option>
                                    <option value="Grade 2">Grade 2</option>
                                    <option value="Grade 3">Grade 3</option>
                                    <option value="Grade 4">Grade 4</option>
                                    <option value="Grade 5">Grade 5</option>
                                    <option value="Grade 6">Grade 6</option>
                                    <option value="Grade 7">Grade 7</option>
                                    <option value="Grade 8">Grade 8</option>
                                    <option value="Grade 9">Grade 9</option>
                                    <option value="Grade 10">Grade 10</option>
                                    <option value="Grade 11">Grade 11</option>
                                    <option value="Grade 12">Grade 12</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </form>
                    </div>
                    <div className="form-image">
                        <div className="tracking-section" style={{ padding: '30px', background: 'rgba(255,255,255,0.9)', borderRadius: '15px', backdropFilter: 'blur(10px)', margin: 'auto', width: '80%', marginTop: '50px' }}>
                            <h3 style={{ color: 'var(--primary-color)', marginBottom: '15px' }}>Track Your Application</h3>
                            <form onSubmit={handleTrackSubmit} className="tracking-form">
                                <div className="form-group">
                                    <input
                                        type="text"
                                        placeholder="Enter Tracking ID"
                                        value={trackingInput}
                                        onChange={(e) => setTrackingInput(e.target.value)}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '15px' }}
                                    />
                                    <button type="submit" className="btn" style={{ width: '100%' }}>Track Status</button>
                                </div>
                            </form>

                            {trackingError && <div className="alert alert-error mt-3">{trackingError}</div>}

                            {trackingResult && (
                                <div className="tracking-result mt-4" style={{ padding: '20px', background: '#28a745', color: '#ffffff', borderRadius: '8px', borderLeft: '4px solid var(--accent-color)', boxShadow: '0 4px 6px rgba(40, 167, 69, 0.2)' }}>
                                    <h4 style={{ margin: '0 0 10px 0', color: '#ffffff' }}>{trackingResult.name}</h4>
                                    <p><strong>Applying for:</strong> {trackingResult.grade}</p>
                                    <div className="status-timeline mt-3">
                                        <p><strong>Current Status:</strong> <span style={{ color: '#ffffff', fontWeight: 'bold', background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: '4px' }}>{trackingResult.application_stage}</span></p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AdmissionForm;
