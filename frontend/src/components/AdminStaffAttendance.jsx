import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AdminDashboard.css';
import './AdminStaffAttendance.css';

const AdminStaffAttendance = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    
    // Graph modal state
    const [isGraphOpen, setIsGraphOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [teacherReport, setTeacherReport] = useState([]);
    const [loadingReport, setLoadingReport] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/admin/login');
        } else {
            fetchStaffAttendance(date);
        }
    }, [navigate, date]);

    const fetchStaffAttendance = async (selectedDate) => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`http://localhost:5000/admin/staff-attendance?date=${selectedDate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                if(res.status === 401 || res.status === 403) navigate('/admin/login');
                throw new Error('Failed to fetch staff attendance');
            }

            const data = await res.json();
            
            // Map the API data to local state, setting defaults if no attendance record exists
            const mappedData = data.map(staff => ({
                teacher_id: staff.teacher_id,
                name: staff.name,
                subject: staff.subject,
                image_url: staff.image_url,
                status: staff.status || 'Absent', // Default to Absent if no biometric punch exists
                remarks: staff.remarks || '-',
                punch_in: staff.punch_in || '-',
                punch_out: staff.punch_out || '-'
            }));
            
            setStaffList(mappedData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOverride = async (teacher_id, field, value) => {
        // Optimistic UI update
        setStaffList(prevList => 
            prevList.map(staff => staff.teacher_id === teacher_id ? { ...staff, [field]: value } : staff)
        );
        
        // Find existing record data to push entirely backward to DB
        const staffRec = staffList.find(s => s.teacher_id === teacher_id);
        const latestStatus = field === 'status' ? value : staffRec.status;
        const latestRemarks = field === 'remarks' ? value : staffRec.remarks;

        try {
            const token = localStorage.getItem('adminToken');
            await fetch('http://localhost:5000/admin/staff-attendance', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    date, 
                    attendanceData: [{ teacher_id, status: latestStatus, remarks: latestRemarks }] 
                })
            });
        } catch (err) {
            console.error('Failed to save override', err);
        }
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        
        // 1. School Header
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("ANNAI THERASA HR SEC SCHOOL", 105, 20, { align: "center" });
        
        // 2. Report Title
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text("Daily Staff Attendance & Biometric Report", 105, 28, { align: "center" });

        // 3. Date & Stats
        doc.setFontSize(11);
        doc.setFont("helvetica", "italic");
        doc.text(`Date: ${date}`, 14, 40);
        doc.text(`Total Staff: ${stats.total} | Present: ${stats.present} | Absent: ${stats.absent}`, 196, 40, { align: "right" });

        // 4. Divider Line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(14, 43, 196, 43);

        // 5. Build Data Table
        const tableColumn = ["Staff Name", "Subject", "Punch In", "Punch Out", "Status", "Remarks"];
        const tableRows = [];

        staffList.forEach(staff => {
            const staffData = [
                staff.name,
                staff.subject,
                staff.punch_in,
                staff.punch_out,
                staff.status,
                staff.remarks
            ];
            tableRows.push(staffData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 48,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] }
        });

        doc.save(`Staff_Attendance_${date}.pdf`);
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
    };

    const handleViewGraph = async (staff) => {
        setSelectedTeacher(staff);
        setIsGraphOpen(true);
        setLoadingReport(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`http://localhost:5000/admin/staff-attendance/report/${staff.teacher_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                
                // Format data for Recharts: Let's plot 'Present' vs 'Absent' 
                // We map status to a 1 (Present) or 0 (Absent/Leave) for a simple bar height
                const formatted = data.map(d => ({
                    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    status: d.status,
                    punch_in: d.punch_in || '-',
                    punch_out: d.punch_out || '-',
                    remarks: d.remarks || '-',
                    presentValue: d.status === 'Present' || d.status === 'Half-day' ? 1 : 0
                }));
                // If no records in last 30 days, we'll just have an empty array
                setTeacherReport(formatted);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingReport(false);
        }
    };

    const downloadSingleReportPDF = () => {
        if (!selectedTeacher || !teacherReport.length) return;

        const doc = new jsPDF();
        
        // 1. School Header
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("ANNAI THERASA HR SEC SCHOOL", 105, 20, { align: "center" });
        
        // 2. Report Subtitle
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text("Individual 30-Day Biometric Record", 105, 28, { align: "center" });

        // 3. Teacher Personal Info
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`Staff Name: ${selectedTeacher.name}`, 14, 40);
        doc.setFont("helvetica", "normal");
        doc.text(`Subject Area: ${selectedTeacher.subject}`, 196, 40, { align: "right" });

        // 4. Divider Line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(14, 43, 196, 43);

        const tableColumn = ["Date", "Status", "Punch In", "Punch Out", "Remarks"];
        const tableRows = [];

        teacherReport.forEach(report => {
            tableRows.push([
                report.date,
                report.status,
                report.punch_in,
                report.punch_out,
                report.remarks
            ]);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 48,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] }
        });

        doc.save(`${selectedTeacher.name.replace(/\s+/g, '_')}_30Day_Report.pdf`);
    };

    // Count statistics
    const stats = {
        total: staffList.length,
        present: staffList.filter(s => s.status === 'Present').length,
        absent: staffList.filter(s => s.status === 'Absent').length,
        leave: staffList.filter(s => s.status === 'Leave').length,
        halfDay: staffList.filter(s => s.status === 'Half-day').length
    };

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <div className="admin-logo">Admin - Staff Attendance</div>
                <div>
                    <a href="/admin" className="back-link" style={{ marginRight: '15px' }}>Dashboard Home</a>
                    <a href="/admin/teachers" className="back-link" style={{ marginRight: '15px', background: 'var(--accent-color)', color: 'var(--primary-color)', padding: '5px 10px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>👩‍🏫 Faculty</a>
                    <button onClick={handleLogout} style={{
                        background: 'rgba(255,255,255,0.2)', color: 'var(--bg-white)',
                        border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer',
                        fontWeight: '600', fontSize: '0.9rem', transition: 'background 0.2s'
                    }}>Logout</button>
                </div>
            </header>

            <div className="admin-container">
                <header className="admin-attendance-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'white', padding: '15px 20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Staff Daily Attendance</h2>
                    <div className="date-picker-container" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label htmlFor="attendance-date" style={{ fontWeight: 'bold' }}>Date:</label>
                            <input 
                                type="date" 
                                id="attendance-date"
                                value={date} 
                                onChange={(e) => setDate(e.target.value)} 
                                className="attendance-date-input"
                            />
                        </div>
                        <button 
                            onClick={downloadPDF} 
                            style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                            📄 Download PDF
                        </button>
                    </div>
                </header>

                {error && <div className="error-message">{error}</div>}
                {successMsg && <div className="success-message">{successMsg}</div>}

                <div className="attendance-stats">
                    <div className="stat-card total">Total Staff: <strong>{stats.total}</strong></div>
                    <div className="stat-card present">Present: <strong>{stats.present}</strong></div>
                    <div className="stat-card absent">Absent: <strong>{stats.absent}</strong></div>
                    <div className="stat-card leave">On Leave: <strong>{stats.leave}</strong></div>
                    <div className="stat-card halfday">Half-day: <strong>{stats.halfDay}</strong></div>
                </div>

                <div className="attendance-content">
                    {loading ? (
                        <p className="loading">Loading staff data...</p>
                    ) : staffList.length === 0 ? (
                        <p className="no-data">No teachers found in the database. Please add teachers first.</p>
                    ) : (
                        <div className="attendance-table-wrapper">
                            <table className="attendance-table">
                                <thead>
                                    <tr>
                                        <th>Staff Member</th>
                                        <th>Subject</th>
                                        <th>Biometric Log</th>
                                        <th>Status</th>
                                        <th>Remarks</th>
                                        <th>Graph</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staffList.map((staff) => (
                                        <tr key={staff.teacher_id} className={`status-${staff.status.toLowerCase().replace('-', '')}`}>
                                            <td className="staff-info-cell">
                                                <img src={staff.image_url} alt={staff.name} className="staff-avatar" />
                                                <span>{staff.name}</span>
                                            </td>
                                            <td>{staff.subject}</td>
                                            <td className="biometric-cell" style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                <div>IN: <strong>{staff.punch_in}</strong></div>
                                                <div>OUT: <strong>{staff.punch_out}</strong></div>
                                            </td>
                                            <td className="status-cell">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span className={`status-badge ${staff.status.toLowerCase()}`} style={{ 
                                                        padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', minWidth: '60px', textAlign: 'center',
                                                        background: staff.status === 'Present' ? '#10b981' : staff.status === 'Absent' ? '#ef4444' : staff.status === 'Leave' ? '#f59e0b' : '#3b82f6',
                                                        color: 'white'
                                                    }}>
                                                        {staff.status}
                                                    </span>
                                                    <select 
                                                        value={staff.status} 
                                                        onChange={(e) => handleOverride(staff.teacher_id, 'status', e.target.value)}
                                                        style={{ padding: '2px', fontSize: '0.8rem', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', outline: 'none' }}
                                                    >
                                                        <option value="Present">Present</option>
                                                        <option value="Absent">Absent</option>
                                                        <option value="Leave">On Leave</option>
                                                        <option value="Half-day">Half-day</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td>
                                                <input 
                                                    type="text" 
                                                    placeholder="Add remark..." 
                                                    value={staff.remarks === '-' ? '' : staff.remarks} 
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setStaffList(prevList => prevList.map(s => s.teacher_id === staff.teacher_id ? { ...s, remarks: val } : s));
                                                    }}
                                                    onBlur={(e) => handleOverride(staff.teacher_id, 'remarks', e.target.value || '-')}
                                                    style={{ padding: '4px 8px', fontSize: '0.85rem', width: '90%', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }}
                                                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                                />
                                            </td>
                                            <td>
                                                <button 
                                                    onClick={() => handleViewGraph(staff)}
                                                    className="view-graph-btn"
                                                    style={{ padding: '6px 10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                                                >
                                                    📊
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Graph Modal */}
                {isGraphOpen && (
                    <div className="admin-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
                        <div className="admin-modal-content" style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '700px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0, color: '#1e293b' }}>Attendance Report: {selectedTeacher?.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    {teacherReport.length > 0 && (
                                        <button 
                                            onClick={downloadSingleReportPDF} 
                                            style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                        >
                                            📄 Download PDF
                                        </button>
                                    )}
                                    <button onClick={() => setIsGraphOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                                </div>
                            </div>
                            
                            {loadingReport ? (
                                <p>Loading 30-day report...</p>
                            ) : teacherReport.length === 0 ? (
                                <p style={{ color: '#64748b' }}>No attendance data found for the last 30 days.</p>
                            ) : (
                                <div style={{ height: '300px', width: '100%' }}>
                                    <p style={{textAlign: 'center', fontSize: '0.85rem', color: '#64748b', marginBottom: '10px'}}>Last 30 Days of Punch-ins</p>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={teacherReport}>
                                            <XAxis dataKey="date" tick={{fontSize: 12}} />
                                            <YAxis ticks={[0, 1]} tickFormatter={(val) => val === 1 ? 'Present' : 'Absent'} />
                                            <Tooltip 
                                                cursor={{fill: '#f1f5f9'}} 
                                                formatter={(value, name, props) => [props.payload.status, 'Status']}
                                            />
                                            <Bar dataKey="presentValue" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminStaffAttendance;
