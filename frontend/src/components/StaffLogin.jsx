import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StaffLogin.css';

const StaffLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/staff/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('adminToken', data.token);
                navigate('/admin/student-grading');
            } else {
                setError(data.error || 'Invalid credentials. Please try again.');
            }
        } catch (err) {
            setError('Server connection error. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="staff-login-page">
            {/* Background decoration */}
            <div className="staff-bg-decoration">
                <div className="staff-blob blob-1"></div>
                <div className="staff-blob blob-2"></div>
            </div>

            <div className="staff-login-card">
                {/* Header */}
                <div className="staff-login-header">
                    <div className="staff-icon-wrapper">
                        <i className="fa-solid fa-chalkboard-user"></i>
                    </div>
                    <h1>Staff Portal</h1>
                    <p>Annai Therasa Hr. Sec. School</p>
                    <span className="staff-badge">Grade Management System</span>
                </div>

                {/* Error message */}
                {error && (
                    <div className="staff-error-alert">
                        <i className="fa-solid fa-circle-exclamation"></i> {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} className="staff-login-form">
                    <div className="staff-input-group">
                        <label>Staff Username</label>
                        <div className="staff-input-wrapper">
                            <i className="fa-solid fa-user input-icon"></i>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                required
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    <div className="staff-input-group">
                        <label>Password</label>
                        <div className="staff-input-wrapper">
                            <i className="fa-solid fa-lock input-icon"></i>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                                title={showPassword ? 'Hide password' : 'Show password'}
                            >
                                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="staff-login-btn" disabled={loading}>
                        {loading ? (
                            <><i className="fa-solid fa-spinner fa-spin"></i> Authenticating...</>
                        ) : (
                            <><i className="fa-solid fa-right-to-bracket"></i> Login to Grade System</>
                        )}
                    </button>
                </form>

                <div className="staff-login-footer">
                    <a href="/"><i className="fa-solid fa-arrow-left"></i> Return to Main Website</a>
                </div>
            </div>
        </div>
    );
};

export default StaffLogin;
