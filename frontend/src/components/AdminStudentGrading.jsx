import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AdminDashboard.css';
import './AdminStudentGrading.css';

const AdminStudentGrading = () => {
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [examTerm, setExamTerm] = useState('Mid-Term');
    const [filterGrade, setFilterGrade] = useState('All');
    
    // Manual Student Add State
    const [showAddStudent, setShowAddStudent] = useState(false);
    const [newStudentName, setNewStudentName] = useState('');
    const [newStudentGrade, setNewStudentGrade] = useState('LKG');
    const [newRollNumber, setNewRollNumber] = useState('');
    const [newDob, setNewDob] = useState('');
    const [addingStudent, setAddingStudent] = useState(false);
    
    // Grading Form State
    const [marks, setMarks] = useState({
        Mathematics: '',
        Science: '',
        English: '',
        History: '',
        Geography: ''
    });
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [pastResults, setPastResults] = useState([]);

    const navigate = useNavigate();
    const token = localStorage.getItem('adminToken');

    useEffect(() => {
        if (!token) {
            navigate('/admin/login');
        } else {
            fetchStudents();
        }
    }, [navigate, token]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/admin/active-students', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch students');
            const data = await res.json();
            setStudents(data);
            if (data.length > 0) handleSelectStudent(data[0]);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectStudent = async (student) => {
        setSelectedStudent(student);
        setMarks({ Mathematics: '', Science: '', English: '', History: '', Geography: '' });
        setSuccessMessage('');
        setError('');
        
        try {
            const res = await fetch(`http://localhost:5000/admin/exams/${student.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPastResults(data);
                
                // Pre-fill if we have results for exactly this term
                const termResults = data.filter(d => d.exam_term === examTerm);
                if (termResults.length > 0) {
                    const newMarks = { Mathematics: '', Science: '', English: '', History: '', Geography: '' };
                    termResults.forEach(r => {
                        if (newMarks[r.subject] !== undefined) newMarks[r.subject] = r.marks_obtained;
                    });
                    setMarks(newMarks);
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Whenever term changes, try to load existing marks for the selected student & term
    useEffect(() => {
        if (selectedStudent && pastResults.length > 0) {
            const termResults = pastResults.filter(d => d.exam_term === examTerm);
            const newMarks = { Mathematics: '', Science: '', English: '', History: '', Geography: '' };
            termResults.forEach(r => {
                if (newMarks[r.subject] !== undefined) newMarks[r.subject] = r.marks_obtained;
            });
            setMarks(newMarks);
            setSuccessMessage('');
        }
    }, [examTerm, selectedStudent, pastResults]);

    const handleMarkChange = (subject, value) => {
        setMarks(prev => ({ ...prev, [subject]: value }));
    };

    const handleSaveGrades = async () => {
        if (!selectedStudent) return;
        setSaving(true);
        setError('');
        setSuccessMessage('');
        
        try {
            const subjects = Object.keys(marks);
            
            // Save each subject sequentially for simplicity
            for (const subject of subjects) {
                const val = marks[subject];
                if (val === '') continue; // Skip empty
                
                await fetch(`http://localhost:5000/admin/exams/${selectedStudent.id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        exam_term: examTerm,
                        subject: subject,
                        marks_obtained: parseFloat(val)
                    })
                });
            }
            
            setSuccessMessage('Grades updated successfully!');
            // Re-fetch to update history
            handleSelectStudent(selectedStudent);
        } catch (err) {
            console.error('Save error', err);
            setError('Failed to save grades');
        } finally {
            setSaving(false);
            setTimeout(() => setSuccessMessage(''), 3000);
        }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        setAddingStudent(true);
        try {
            const res = await fetch('http://localhost:5000/admin/grading/add-student', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: newStudentName, grade: newStudentGrade, roll_number: newRollNumber, dob: newDob })
            });
            if (res.ok) {
                const data = await res.json();
                alert(`Student added!`);
                setShowAddStudent(false);
                setNewStudentName('');
                setNewStudentGrade('LKG');
                setNewRollNumber('');
                setNewDob('');
                fetchStudents(); // Refresh list
            } else {
                alert('Failed to add student');
            }
        } catch (err) {
            console.error(err);
            alert('Error adding student');
        } finally {
            setAddingStudent(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
    };

    const generateReportCard = () => {
        if (!selectedStudent) return;
        
        const doc = new jsPDF();
        
        // --- LETTERHEAD ---
        // Blue Gradient Style Banner
        doc.setFillColor(59, 130, 246);
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("ANNAI THERASA HR SEC SCHOOL", 105, 18, { align: "center" });
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text("OFFICIAL REPORT CARD", 105, 28, { align: "center" });
        
        // Reset Text Color
        doc.setTextColor(30, 41, 59);

        // --- STUDENT INFO ---
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Student Name:", 14, 55);
        doc.setFont("helvetica", "normal");
        doc.text(selectedStudent.name, 50, 55);
        
        doc.setFont("helvetica", "bold");
        doc.text("Student ID:", 14, 63);
        doc.setFont("helvetica", "normal");
        doc.text(selectedStudent.roll_number || `#${selectedStudent.id}`, 50, 63);
        
        doc.setFont("helvetica", "bold");
        doc.text("Grade/Class:", 130, 55);
        doc.setFont("helvetica", "normal");
        doc.text(selectedStudent.grade, 160, 55);
        
        doc.setFont("helvetica", "bold");
        doc.text("Exam Term:", 130, 63);
        doc.setFont("helvetica", "normal");
        doc.text(examTerm, 160, 63);

        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(14, 70, 196, 70);

        // --- PREPARE DATA ---
        let totalObtained = 0;
        let totalPossible = Object.keys(marks).length * 100;
        
        const tableColumn = ["Subject", "Total Marks", "Marks Obtained", "Grade"];
        const tableRows = [];

        Object.keys(marks).forEach(sub => {
            const val = parseFloat(marks[sub]);
            if (!isNaN(val)) {
                totalObtained += val;
                let grade = val >= 90 ? 'A+' : val >= 80 ? 'A' : val >= 70 ? 'B' : val >= 60 ? 'C' : val >= 50 ? 'D' : 'F';
                tableRows.push([sub, '100', marks[sub], grade]);
            } else {
                tableRows.push([sub, '100', '-', '-']);
            }
        });

        // Add overall calculation row
        tableRows.push([{ content: "OVERALL TOTAL", colSpan: 1, styles: { fontStyle: 'bold' } }, "500", totalObtained.toString(), totalObtained >= 250 ? "PASS" : "FAIL"]);

        // --- RENDER TABLE ---
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 75,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
            styles: { fontSize: 11, padding: 8 }
        });
        
        // --- FOOTER SIGNATURES ---
        let finalY = doc.lastAutoTable.finalY || 150;
        
        doc.setFont("helvetica", "bold");
        doc.text("Percentage: " + ((totalObtained/totalPossible)*100).toFixed(1) + "%", 14, finalY + 15);
        
        doc.setFont("helvetica", "normal");
        doc.text("__________________________", 30, finalY + 50);
        doc.text("Class Teacher", 40, finalY + 58);
        
        doc.text("__________________________", 130, finalY + 50);
        doc.text("Principal's Signature", 135, finalY + 58);

        doc.save(`${selectedStudent.name.replace(/\s+/g, '_')}_${examTerm}_ReportCard.pdf`);
    };

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <div className="admin-logo">Admin - Student Grading</div>
                <div>
                    <a href="/admin" className="back-link" style={{ marginRight: '15px' }}>Dashboard Home</a>
                    <a href="/admin/staff-attendance" className="back-link" style={{ marginRight: '15px' }}>Staff Attendance</a>
                    <button onClick={handleLogout} style={{
                        background: 'rgba(255,255,255,0.2)', color: 'var(--bg-white)',
                        border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer',
                        fontWeight: '600', fontSize: '0.9rem', transition: 'background 0.2s'
                    }}>Logout</button>
                </div>
            </header>

            <div className="admin-container student-grading-container">
                <header className="admin-attendance-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '15px 20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Student Exam Grading Portal</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ fontWeight: 'bold' }}>Active Term:</span>
                        <select className="term-select" value={examTerm} onChange={(e) => setExamTerm(e.target.value)}>
                            <option value="First-Term">First Term</option>
                            <option value="Mid-Term">Mid Term</option>
                            <option value="Finals">Finals</option>
                        </select>
                    </div>
                </header>

                <div className="grading-layout">
                    {/* Sidebar: Student List */}
                    <div className="student-list-sidebar">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                            <h3 style={{ margin: 0 }}>Active Students</h3>
                            <button 
                                onClick={() => setShowAddStudent(true)}
                                style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                            >
                                ➕ Add Student
                            </button>
                        </div>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <select 
                                value={filterGrade} 
                                onChange={(e) => setFilterGrade(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
                            >
                                <option value="All">All Classes</option>
                                <option value="LKG">LKG</option>
                                <option value="UKG">UKG</option>
                                <option value="1st Standard">1st Standard</option>
                                <option value="2nd Standard">2nd Standard</option>
                                <option value="3rd Standard">3rd Standard</option>
                                <option value="4th Standard">4th Standard</option>
                                <option value="5th Standard">5th Standard</option>
                                <option value="6th Standard">6th Standard</option>
                                <option value="7th Standard">7th Standard</option>
                                <option value="8th Standard">8th Standard</option>
                                <option value="9th Standard">9th Standard</option>
                                <option value="10th Standard">10th Standard</option>
                                <option value="11th Standard">11th Standard</option>
                                <option value="12th Standard">12th Standard</option>
                            </select>
                        </div>

                        {loading && <p>Loading students...</p>}
                        {!loading && students.length === 0 && <p>No students found.</p>}
                        
                        {students
                            .filter(s => filterGrade === 'All' || s.grade === filterGrade)
                            .map(student => (
                            <div 
                                key={student.id} 
                                className={`student-list-item ${selectedStudent?.id === student.id ? 'active' : ''}`}
                                onClick={() => handleSelectStudent(student)}
                            >
                                <strong style={{ fontSize: '1.05rem' }}>{student.name}</strong>
                                <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>Grade: {student.grade} | Roll No: {student.roll_number}</span>
                            </div>
                        ))}
                    </div>

                    {/* Main Grading Panel */}
                    <div className="grading-panel">
                        {error && <div className="error-message" style={{ color: 'white', background: '#ef4444', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>{error}</div>}
                        {successMessage && <div className="success-message" style={{ color: 'white', background: '#10b981', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>{successMessage}</div>}

                        {selectedStudent ? (
                            <>
                                <div className="grading-header">
                                    <div>
                                        <h2 style={{ margin: '0 0 5px 0' }}>{selectedStudent.name}'s Grades</h2>
                                        <p style={{ margin: 0, color: '#64748b' }}>Input marks strictly out of 100 for {examTerm}.</p>
                                    </div>
                                    <button onClick={generateReportCard} className="btn-generate-report" disabled={saving}>
                                        <i className="fa-solid fa-file-pdf"></i> Generate Report Card
                                    </button>
                                </div>

                                <div className="grading-form">
                                    {Object.keys(marks).map(subject => (
                                        <div className="subject-input-group" key={subject}>
                                            <label style={{ fontWeight: 'bold', color: '#1e293b' }}>{subject}</label>
                                            <input 
                                                type="number" 
                                                min="0" 
                                                max="100" 
                                                placeholder="Enter marks from 0-100"
                                                value={marks[subject]}
                                                onChange={(e) => handleMarkChange(subject, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <button 
                                    onClick={handleSaveGrades} 
                                    disabled={saving}
                                    style={{ width: '100%', padding: '12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                >
                                    {saving ? '⏳ Saving Grades...' : '💾 Save Official Grades'}
                                </button>
                                
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '50px 0' }}>
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Select a Student</h3>
                                <p>Choose a student from the sidebar to manage their grades and generate report cards.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal for adding a manual student */}
            {showAddStudent && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>Add Student for Grading</h3>
                            <button onClick={() => setShowAddStudent(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>&times;</button>
                        </div>
                        <form onSubmit={handleAddStudent}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Student Name</label>
                                <input 
                                    type="text" value={newStudentName} onChange={e => setNewStudentName(e.target.value)}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} required 
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Roll Number</label>
                                <input 
                                    type="text" value={newRollNumber} onChange={e => setNewRollNumber(e.target.value)}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} required 
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date of Birth</label>
                                <input 
                                    type="date" value={newDob} onChange={e => setNewDob(e.target.value)}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} required 
                                />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Class / Grade</label>
                                <select 
                                    value={newStudentGrade} onChange={e => setNewStudentGrade(e.target.value)}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} required
                                >
                                    <option value="LKG">LKG</option>
                                    <option value="UKG">UKG</option>
                                    <option value="1st Standard">1st Standard</option>
                                    <option value="2nd Standard">2nd Standard</option>
                                    <option value="3rd Standard">3rd Standard</option>
                                    <option value="4th Standard">4th Standard</option>
                                    <option value="5th Standard">5th Standard</option>
                                    <option value="6th Standard">6th Standard</option>
                                    <option value="7th Standard">7th Standard</option>
                                    <option value="8th Standard">8th Standard</option>
                                    <option value="9th Standard">9th Standard</option>
                                    <option value="10th Standard">10th Standard</option>
                                    <option value="11th Standard">11th Standard</option>
                                    <option value="12th Standard">12th Standard</option>
                                </select>
                            </div>
                            <button type="submit" disabled={addingStudent} style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                                {addingStudent ? 'Adding...' : 'Add Student'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminStudentGrading;
