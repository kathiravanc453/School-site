import React, { useState } from 'react';
import './StudentResults.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const StudentResults = () => {
    const [studentName, setStudentName] = useState('');
    const [rollNumber, setRollNumber] = useState('');
    const [dob, setDob] = useState('');
    const [studentClass, setStudentClass] = useState('LKG');
    const [student, setStudent] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!rollNumber || !dob) return;

        setLoading(true);
        setError('');
        setStudent(null);
        setResults([]);

        try {
            const res = await fetch('http://localhost:5000/exams/student/results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: studentName, roll_number: rollNumber, dob, grade: studentClass })
            });
            const data = await res.json();
            
            if (res.ok) {
                setStudent(data.student);
                setResults(data.results);
            } else {
                setError(data.error || 'Student not found. Please check your Roll Number and Date of Birth.');
            }
        } catch (err) {
            setError('Error connecting to the server. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Group results by exam term
    const groupedResults = results.reduce((acc, curr) => {
        if (!acc[curr.exam_term]) acc[curr.exam_term] = [];
        acc[curr.exam_term].push(curr);
        return acc;
    }, {});

    const generateReportCard = (term, termResults) => {
        if (!student) return;
        
        const doc = new jsPDF();
        
        doc.setFillColor(59, 130, 246);
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.text("ANNAI THERASA HR SEC SCHOOL", 105, 18, { align: "center" });
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "normal");
        doc.text("OFFICIAL REPORT CARD", 105, 28, { align: "center" });
        
        doc.setTextColor(30, 41, 59);

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Student Name:", 14, 55);
        doc.setFont("helvetica", "normal");
        doc.text(student.name, 50, 55);
        
        doc.setFont("helvetica", "bold");
        doc.text("Roll Number:", 14, 63);
        doc.setFont("helvetica", "normal");
        doc.text(rollNumber, 50, 63);
        
        doc.setFont("helvetica", "bold");
        doc.text("Grade/Class:", 130, 55);
        doc.setFont("helvetica", "normal");
        doc.text(student.grade, 160, 55);
        
        doc.setFont("helvetica", "bold");
        doc.text("Exam Term:", 130, 63);
        doc.setFont("helvetica", "normal");
        doc.text(term, 160, 63);

        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(14, 70, 196, 70);

        let totalObtained = 0;
        let totalPossible = termResults.length * 100;
        
        const tableColumn = ["Subject", "Total Marks", "Marks Obtained", "Grade"];
        const tableRows = [];

        termResults.forEach(r => {
            const val = parseFloat(r.marks_obtained);
            if (!isNaN(val)) {
                totalObtained += val;
                let grade = val >= 90 ? 'A+' : val >= 80 ? 'A' : val >= 70 ? 'B' : val >= 60 ? 'C' : val >= 50 ? 'D' : 'F';
                tableRows.push([r.subject, '100', val.toString(), grade]);
            }
        });

        tableRows.push([{ content: "OVERALL TOTAL", colSpan: 1, styles: { fontStyle: 'bold' } }, totalPossible.toString(), totalObtained.toString(), totalObtained >= (totalPossible/2) ? "PASS" : "FAIL"]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 75,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
            styles: { fontSize: 11, padding: 8 }
        });
        
        let finalY = doc.lastAutoTable.finalY || 150;
        
        doc.setFont("helvetica", "bold");
        const percentage = totalPossible > 0 ? ((totalObtained/totalPossible)*100).toFixed(1) : "0.0";
        doc.text("Percentage: " + percentage + "%", 14, finalY + 15);
        
        doc.setFont("helvetica", "normal");
        doc.text("__________________________", 30, finalY + 50);
        doc.text("Class Teacher", 40, finalY + 58);
        
        doc.text("__________________________", 130, finalY + 50);
        doc.text("Principal's Signature", 135, finalY + 58);

        doc.save(`${student.name.replace(/\s+/g, '_')}_${term}_ReportCard.pdf`);
    };

    const handleReset = () => {
        setStudent(null);
        setResults([]);
        setStudentName('');
        setRollNumber('');
        setDob('');
        setError('');
    };

    return (
        <div className="results-page-container">
            <div className={`results-auth-card ${student ? 'expanded' : ''}`}>
                {!student ? (
                    <>
                        <div className="results-header">
                            <h2>Result Verification Portal</h2>
                            <p>Enter your official credentials below to access and download your term report cards securely.</p>
                        </div>

                        {error && <div className="error-alert"><i className="fa-solid fa-triangle-exclamation"></i> {error}</div>}

                        <form onSubmit={handleSearch}>
                            <div className="results-form-grid">
                                <div className="input-group">
                                    <label>Student Full Name</label>
                                    <input
                                        type="text"
                                        className="auth-input"
                                        placeholder="e.g. John Doe"
                                        value={studentName}
                                        onChange={(e) => setStudentName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Class / Grade</label>
                                    <select
                                        className="auth-input"
                                        value={studentClass}
                                        onChange={(e) => setStudentClass(e.target.value)}
                                        required
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
                                <div className="input-group">
                                    <label>Roll Number</label>
                                    <input
                                        type="text"
                                        className="auth-input"
                                        placeholder="e.g. 10452"
                                        value={rollNumber}
                                        onChange={(e) => setRollNumber(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Date of Birth</label>
                                    <input
                                        type="date"
                                        className="auth-input"
                                        value={dob}
                                        onChange={(e) => setDob(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <button type="submit" className="auth-submit-btn" disabled={loading}>
                                {loading ? 'Verifying Credentials...' : 'Access Report Cards'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="results-dashboard">
                        <div className="student-profile-banner">
                            <div className="profile-details">
                                <h3>{student.name}</h3>
                                <p>
                                    <span className="profile-badge"><i className="fa-solid fa-graduation-cap"></i> {student.grade}</span>
                                    <span className="profile-badge"><i className="fa-solid fa-id-card"></i> Roll No: {rollNumber}</span>
                                </p>
                            </div>
                            <button onClick={handleReset} className="reset-search-btn">
                                <i className="fa-solid fa-arrow-left"></i> Check Another
                            </button>
                        </div>

                        {results.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                                <i className="fa-solid fa-folder-open" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '15px' }}></i>
                                <h3>No Results Published Yet</h3>
                                <p>Your exam results will appear here once they are officially released by the school.</p>
                            </div>
                        ) : (
                            <div className="term-results-container">
                                {Object.keys(groupedResults).map((term, idx) => (
                                    <div key={term} className="term-result-card" style={{ animationDelay: `${idx * 0.15}s` }}>
                                        <div className="term-header">
                                            <h3>{term} Examinations</h3>
                                            <button onClick={() => generateReportCard(term, groupedResults[term])} className="download-report-btn">
                                                <i className="fa-solid fa-download"></i> PDF Report
                                            </button>
                                        </div>
                                        <table className="marks-table">
                                            <thead>
                                                <tr>
                                                    <th>Subject</th>
                                                    <th style={{ textAlign: 'center' }}>Maximum Marks</th>
                                                    <th style={{ textAlign: 'center' }}>Marks Obtained</th>
                                                    <th style={{ textAlign: 'center' }}>Grade Achieved</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {groupedResults[term].map((res, index) => {
                                                    const val = parseFloat(res.marks_obtained);
                                                    let gradeStr = '-';
                                                    let gradeClass = '';
                                                    if (!isNaN(val)) {
                                                        if (val >= 90) { gradeStr = 'A+'; gradeClass = 'grade-A'; }
                                                        else if (val >= 80) { gradeStr = 'A'; gradeClass = 'grade-A'; }
                                                        else if (val >= 70) { gradeStr = 'B'; gradeClass = 'grade-B'; }
                                                        else if (val >= 60) { gradeStr = 'C'; gradeClass = 'grade-C'; }
                                                        else if (val >= 50) { gradeStr = 'D'; gradeClass = 'grade-D'; }
                                                        else { gradeStr = 'F'; gradeClass = 'grade-F'; }
                                                    }
                                                    return (
                                                        <tr key={index}>
                                                            <td>{res.subject}</td>
                                                            <td style={{ textAlign: 'center', color: '#94a3b8' }}>100</td>
                                                            <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>{res.marks_obtained}</td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                <span className={`grade-badge ${gradeClass}`}>{gradeStr}</span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentResults;
