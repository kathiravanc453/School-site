import React, { useState, useEffect } from 'react';
import './AdminDashboard.css'; // Reuse existing admin styles
import './AdminMessages.css';

const AdminMessages = () => {
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(false);
    
    // Quick template options
    const templates = [
        "Your child's admission form is currently under review.",
        "Your child's leave request has been approved.",
        "Gentle reminder: Fees for the upcoming term are due next week."
    ];

    const token = localStorage.getItem('adminToken');

    useEffect(() => {
        if (!token) {
            window.location.href = '/admin/login';
        }
    }, [token]);

    const handleSendSMS = async (e) => {
        e.preventDefault();
        
        // Extract all 10-digit numeric numbers from the textarea
        const rawNumbers = phone.split(/[\s,;\n]+/);
        const validNumbers = [];
        
        rawNumbers.forEach(num => {
            const cleaned = num.replace(/[^0-9]/g, '');
            // Simple validation: must end with 10 digits
            if (cleaned.length >= 10) {
                // If it has a country code like 919876543210, strip to last 10 
                const last10 = cleaned.slice(-10);
                if (!validNumbers.includes(last10)) {
                    validNumbers.push(last10);
                }
            }
        });

        if (validNumbers.length === 0) {
            setStatus({ type: 'error', text: 'Please enter at least one valid 10-digit mobile number.' });
            return;
        }
        if (!message.trim()) {
            setStatus({ type: 'error', text: 'Please enter a message.' });
            return;
        }

        setIsLoading(true);
        setStatus({ type: '', text: `Preparing to send to ${validNumbers.length} recipients...` });

        let successCount = 0;
        let failCount = 0;

        try {
            // Process in parallel with Promise.all for speed
            await Promise.all(validNumbers.map(async (num) => {
                try {
                    const response = await fetch('http://localhost:5000/admin/send-sms', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ phone: num, message })
                    });
                    
                    if (response.ok) {
                        successCount++;
                    } else {
                        failCount++;
                    }
                } catch {
                    failCount++;
                }
            }));

            if (failCount === 0) {
                setStatus({ type: 'success', text: `✅ Bulk SMS sent successfully to ${successCount} numbers!` });
                setPhone('');
                setMessage('');
            } else {
                setStatus({ type: 'error', text: `⚠️ Sent to ${successCount} numbers. Failed on ${failCount} numbers.` });
            }
            
        } catch (error) {
            setStatus({ type: 'error', text: 'Error connecting to the server.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <div className="admin-logo">
                    Message Center
                </div>
                <div>
                    <a href="/admin" className="back-link" style={{ marginRight: '15px' }}>← Back to Dashboard</a>
                    <button onClick={() => { localStorage.removeItem('adminToken'); window.location.href = '/admin/login'; }} className="btn" style={{background: 'rgba(255,255,255,0.2)'}}>
                        Logout
                    </button>
                </div>
            </header>

            <div className="admin-container">
                <div className="msg91-card">
                    <div className="card-header">
                        <h2>Direct SMS Portal</h2>
                        <span className="badge">MSG91 Connected</span>
                    </div>
                    
                    <p className="subtitle">Send a direct text message customized for a specific parent/student. Remember that your MSG91 Dashboard must approve the template format.</p>

                    {status.text && (
                        <div className={`status-banner ${status.type}`}>
                            {status.text}
                        </div>
                    )}

                    <form onSubmit={handleSendSMS} className="sms-form">
                        <div className="form-group">
                            <label>Recipient Mobile Numbers</label>
                            <p style={{fontSize: '0.8rem', color: '#666', marginTop: '-5px', marginBottom: '8px'}}>Enter multiple numbers separated by commas, spaces, or on new lines. You can easily copy/paste a list of 1000+ numbers here.</p>
                            <div className="phone-input-wrapper" style={{alignItems: 'flex-start'}}>
                                <textarea 
                                    rows="3"
                                    placeholder="e.g. 9876543210, 8765432109, 7654321098"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    style={{ border: 'none', width: '100%', padding: '10px', resize: 'vertical' }}
                                    required
                                />
                            </div>
                            {phone.length > 0 && <div className="char-count">Auto-detected valid numbers will be queued.</div>}
                        </div>

                        <div className="form-group">
                            <label>Quick Templates</label>
                            <div className="template-chips">
                                {templates.map((tpl, i) => (
                                    <button 
                                        type="button" 
                                        key={i} 
                                        className="btn-template"
                                        onClick={() => setMessage(tpl)}
                                    >
                                        Template {i + 1}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Custom Message Text (Will be mapped to variables)</label>
                            <textarea 
                                rows="4" 
                                placeholder="Type your full message content here..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                            />
                            <div className="char-count">Length: {message.length} characters</div>
                        </div>

                        <button type="submit" className="btn-send-sms" disabled={isLoading}>
                            {isLoading ? 'Sending SMS via MSG91...' : 'Send Direct SMS'}
                        </button>
                    </form>
                </div>
                
                <div className="info-card">
                    <h3>How this corresponds to your MSG91 Template</h3>
                    <p>In your MSG91 DLT dashboard, your approved template should look something like:</p>
                    <div className="code-block">
                        "Dear Student, here is an important update for you: {'##var##'}. Regards, School Management"
                    </div>
                    <p>Whatever you type in the box above will automatically replace the <strong>{'##var##'}</strong> variable when it arrives on their phone.</p>
                </div>
            </div>
        </div>
    );
};

export default AdminMessages;
