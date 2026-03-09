import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AdminDashboard.css';

const AdminFees = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal & History States
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    
    // Payment Form States
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [paymentRemarks, setPaymentRemarks] = useState('');
    const [paymentMonth, setPaymentMonth] = useState('');
    const [pendingDeletes, setPendingDeletes] = useState({});
    
    // Walk-in payment specific states
    const [walkinName, setWalkinName] = useState('');
    const [walkinReg, setWalkinReg] = useState('');
    const [walkinPhone, setWalkinPhone] = useState('');
    const [walkinGrade, setWalkinGrade] = useState('General');

    // Set Fee States
    const [newTotalFee, setNewTotalFee] = useState('');
    
    const token = localStorage.getItem('adminToken');

    useEffect(() => {
        if (!token) {
            window.location.href = '/admin/login';
            return;
        }
        fetchFees();
    }, [token]);

    const fetchFees = async () => {
        try {
            const response = await fetch('http://localhost:5000/admin/fees', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStudents(data);
            }
        } catch (err) {
            console.error('Error fetching fees:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async (studentId) => {
        setHistoryLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/admin/fees/history/${studentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setHistory(data);
            }
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleSetTotalFee = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/admin/fees/set', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: selectedStudent.id, total_fee: parseFloat(newTotalFee) })
            });

            if (response.ok) {
                alert('Total fee updated successfully!');
                fetchFees(); // Refresh table
                setSelectedStudent(null);
            }
        } catch (error) {
            alert('Failed to update total fee');
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/admin/fees/pay', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    studentId: selectedStudent.id, 
                    amount: parseFloat(paymentAmount), 
                    payment_method: paymentMethod, 
                    remarks: paymentRemarks,
                    fee_month: paymentMonth
                })
            });

            if (response.ok) {
                alert('Payment recorded successfully!');
                fetchFees(); // Refresh table
                setSelectedStudent(null);
            } else {
                const data = await response.json();
                alert(data.error || 'Payment failed');
            }
        } catch (error) {
            alert('Error recording payment');
        }
    };

    const openActionModal = (student, actionType) => {
        setSelectedStudent({ ...student, actionType });
        if (actionType === 'history') {
            fetchHistory(student.id);
        } else if (actionType === 'setFee') {
            setNewTotalFee(student.total_fee || '');
        } else if (actionType === 'pay') {
            setPaymentAmount('');
            setPaymentRemarks('');
            setPaymentMethod('Cash');
            setPaymentMonth('');
        } else if (actionType === 'walkin') {
            setWalkinName('');
            setWalkinReg('');
            setWalkinPhone('');
            setWalkinGrade('General');
            setPaymentAmount('');
            setPaymentMethod('Cash');
            setPaymentMonth('');
            setSelectedStudent({ actionType: 'walkin', name: 'Direct/Walk-in Payment' });
        }
    };

    const downloadHistoryPDF = () => {
        if (!selectedStudent || history.length === 0) return;
        
        const doc = new jsPDF();
        
        // Title
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text(`Payment History: ${selectedStudent.name}`, 14, 22);
        
        // Subtitle details
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Registration No: ${selectedStudent.reg_number || 'N/A'} | Grade: ${selectedStudent.grade}`, 14, 30);
        doc.text(`Report Generated: ${new Date().toLocaleString()}`, 14, 36);

        // Prep table data
        const tableColumn = ["Date & Time", "Paid For Month", "Amount Paid", "Method", "Remarks"];
        const tableRows = [];

        history.forEach(h => {
            const rowData = [
                new Date(h.payment_date).toLocaleString(),
                h.fee_month || 'General',
                `Rs. ${parseFloat(h.amount).toLocaleString()}`,
                h.payment_method,
                h.remarks || '-'
            ];
            tableRows.push(rowData);
        });

        // Add autoTable
        autoTable(doc, {
            startY: 42,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [39, 174, 96] }, // Green fee theme
            alternateRowStyles: { fillColor: [248, 249, 250] },
            margin: { top: 42 }
        });

        // Save
        doc.save(`${selectedStudent.name}_fee_history.pdf`);
    };

    const handleWalkinPayment = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/admin/fees/walk-in', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: walkinName,
                    reg_number: walkinReg,
                    phone: walkinPhone,
                    grade: walkinGrade,
                    amount: paymentAmount ? parseFloat(paymentAmount) : 0, 
                    payment_method: paymentMethod, 
                    remarks: 'Initial Payment',
                    fee_month: paymentMonth
                })
            });

            if (response.ok) {
                alert('Student added to fee system successfully!');
                fetchFees(); // Refresh table
                setSelectedStudent(null);
            } else {
                const data = await response.json();
                alert(data.error || 'Payment failed');
            }
        } catch (error) {
            alert('Error recording walk-in payment');
        }
    };

    const handleDeleteStudent = (student) => {
        // Optimistically remove from main list
        setStudents(prev => prev.filter(s => s.id !== student.id));

        setPendingDeletes(prev => ({
            ...prev,
            [student.id]: { student }
        }));
    };

    const handleConfirmDelete = async (studentId) => {
        try {
            const response = await fetch(`http://localhost:5000/admin/fees/${studentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                alert('Backend failed to delete student fee record.');
                fetchFees(); // re-sync
            }
        } catch (error) {
            console.error('Error deleting student', error);
            fetchFees(); // re-sync on error
        } finally {
            setPendingDeletes(prev => {
                const newPd = { ...prev };
                delete newPd[studentId];
                return newPd;
            });
        }
    };

    const handleUndoDelete = (studentId) => {
        const pending = pendingDeletes[studentId];
        if (pending) {
            setStudents(prev => {
                const arr = [...prev, pending.student];
                return arr.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            });
            setPendingDeletes(prev => {
                const newPd = { ...prev };
                delete newPd[studentId];
                return newPd;
            });
        }
    };

    const filteredStudents = students.filter(student => {
        const term = searchTerm.toLowerCase();
        return (
            (student.name && student.name.toLowerCase().includes(term)) ||
            (student.reg_number && String(student.reg_number).toLowerCase().includes(term))
        );
    });

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <div className="admin-logo">Fee Management Console</div>
                <div>
                    <a href="/admin" className="back-link" style={{ marginRight: '15px' }}>← Back to Dashboard</a>
                    <button onClick={() => { localStorage.removeItem('adminToken'); window.location.href = '/admin/login'; }} className="btn" style={{background: 'rgba(255,255,255,0.2)'}}>
                        Logout
                    </button>
                </div>
            </header>

            <div className="admin-container">
                {Object.values(pendingDeletes).map(pending => (
                    <div key={pending.student.id} style={{ background: '#34495e', color: 'white', padding: '15px 20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <span style={{ fontSize: '1.05rem' }}>
                            Fee Account for <strong style={{color:'#f1c40f'}}>{pending.student.name}</strong> was removed.
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{fontSize: '0.9rem', color: '#bdc3c7'}}>Confirm to delete permanently:</span>
                            <button 
                                onClick={() => handleConfirmDelete(pending.student.id)} 
                                style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.2s' }}
                            >
                                🗑️ Confirm
                            </button>
                            <button 
                                onClick={() => handleUndoDelete(pending.student.id)} 
                                style={{ background: '#f1c40f', color: '#2c3e50', border: 'none', padding: '8px 15px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.2s' }}
                            >
                                ↩️ Undo
                            </button>
                        </div>
                    </div>
                ))}

                <div style={{ background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px', borderLeft: '4px solid #27ae60', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: '0 0 10px 0', color: '#27ae60' }}>Manage Student Payments</h3>
                        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Set initial fees, log new payments, and view transaction history.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button 
                            onClick={() => openActionModal(null, 'walkin')}
                            style={{ background: '#27ae60', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            ➕ Add Student
                        </button>
                        <input 
                            type="text" 
                            placeholder="🔍 Search name or grade..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '8px 15px', borderRadius: '20px', border: '1px solid #ccc', outline: 'none', width: '250px' }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="loader">Loading financial data...</div>
                ) : students.length === 0 ? (
                    <div className="empty-state">No student records found. Add a student using the button above to start tracking fees.</div>
                ) : (
                    <div className="table-responsive">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Total Fee</th>
                                    <th>Amount Paid</th>
                                    <th>Balance Due</th>
                                    <th style={{ textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map(student => {
                                    const balance = parseFloat(student.total_fee) - parseFloat(student.amount_paid);
                                    let balColor = balance > 0 ? '#dc3545' : balance < 0 ? '#17a2b8' : '#28a745';
                                    
                                    return (
                                    <tr key={student.id}>
                                        <td>
                                            <strong>{student.name}</strong><br/>
                                            <span style={{ fontSize: '0.85rem', color: '#888' }}>Reg No: {student.reg_number || 'N/A'} | {student.grade}</span>
                                        </td>
                                        <td style={{ fontWeight: 'bold' }}>₹{parseFloat(student.total_fee).toLocaleString()}</td>
                                        <td style={{ color: '#28a745', fontWeight: 'bold' }}>₹{parseFloat(student.amount_paid).toLocaleString()}</td>
                                        <td style={{ color: balColor, fontWeight: 'bold' }}>
                                            ₹{balance.toLocaleString()} {balance <= 0 && balance !== 0 ? '(Credit)' : ''}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                <button 
                                                    onClick={() => openActionModal(student, 'pay')}
                                                    style={{ background: '#28a745', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                                                    title="Record a payment"
                                                >💵 Pay</button>
                                                <button 
                                                    onClick={() => openActionModal(student, 'setFee')}
                                                    style={{ background: '#3498db', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                                                    title="Set total required fee"
                                                >✏️ Set Fee</button>
                                                <button 
                                                    onClick={() => openActionModal(student, 'history')}
                                                    style={{ background: '#6c757d', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                                                    title="View translation history"
                                                >📜 History</button>
                                                <button 
                                                    onClick={() => handleDeleteStudent(student)}
                                                    style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                                                    title="Delete student record"
                                                >🗑️ Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* General Modal Overlay for all 3 Actions */}
            {selectedStudent && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '600px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <h3>
                                    {selectedStudent.actionType === 'pay' && `Log Payment: ${selectedStudent.name}`}
                                    {selectedStudent.actionType === 'walkin' && `Add Student to Fee System`}
                                    {selectedStudent.actionType === 'setFee' && `Set Total Fee: ${selectedStudent.name}`}
                                    {selectedStudent.actionType === 'history' && `Payment History: ${selectedStudent.name}`}
                                </h3>
                                {selectedStudent.actionType === 'history' && history.length > 0 && (
                                    <button 
                                        onClick={downloadHistoryPDF}
                                        style={{ background: '#dc3545', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                                    >
                                        📄 Download PDF
                                    </button>
                                )}
                            </div>
                            <button onClick={() => setSelectedStudent(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>&times;</button>
                        </div>

                        {selectedStudent.actionType === 'pay' && (
                            <form onSubmit={handleRecordPayment}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Fee For Month (Optional)</label>
                                    <select value={paymentMonth} onChange={e => setPaymentMonth(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                                        <option value="">-- General Payment --</option>
                                        <option value="January">January</option>
                                        <option value="February">February</option>
                                        <option value="March">March</option>
                                        <option value="April">April</option>
                                        <option value="May">May</option>
                                        <option value="June">June</option>
                                        <option value="July">July</option>
                                        <option value="August">August</option>
                                        <option value="September">September</option>
                                        <option value="October">October</option>
                                        <option value="November">November</option>
                                        <option value="December">December</option>
                                    </select>
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Amount Paying (₹)</label>
                                    <input 
                                        type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                                        required min="1"
                                    />
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Payment Method</label>
                                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                                        <option value="Cash">Cash</option>
                                        <option value="UPI / Online">UPI / Online</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Cheque">Cheque</option>
                                    </select>
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Remarks / Reference No.</label>
                                    <input 
                                        type="text" value={paymentRemarks} onChange={e => setPaymentRemarks(e.target.value)}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                                        placeholder="Optional"
                                    />
                                </div>
                                <button type="submit" style={{ width: '100%', padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Record Payment</button>
                            </form>
                        )}

                        {selectedStudent.actionType === 'walkin' && (
                            <form onSubmit={handleWalkinPayment}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Student Name</label>
                                        <input 
                                            type="text" value={walkinName} onChange={e => setWalkinName(e.target.value)}
                                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} required 
                                        />
                                    </div>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Registration Number</label>
                                        <input 
                                            type="text" value={walkinReg} onChange={e => setWalkinReg(e.target.value)}
                                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} placeholder="e.g. REG-12345"
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Phone Number</label>
                                        <input 
                                            type="text" value={walkinPhone} onChange={e => setWalkinPhone(e.target.value)}
                                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} placeholder="Optional for SMS" 
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Initial Payment Amount (Optional)</label>
                                        <input 
                                            type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} min="0" placeholder="e.g. 5000"
                                        />
                                    </div>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Fee Month (If Paying)</label>
                                        <select value={paymentMonth} onChange={e => setPaymentMonth(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                                            <option value="">-- General Payment --</option>
                                            <option value="January">January</option>
                                            <option value="February">February</option>
                                            <option value="March">March</option>
                                            <option value="April">April</option>
                                            <option value="May">May</option>
                                            <option value="June">June</option>
                                            <option value="July">July</option>
                                            <option value="August">August</option>
                                            <option value="September">September</option>
                                            <option value="October">October</option>
                                            <option value="November">November</option>
                                            <option value="December">December</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Grade / Class</label>
                                        <input 
                                            type="text" value={walkinGrade} onChange={e => setWalkinGrade(e.target.value)}
                                            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} 
                                        />
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Payment Method</label>
                                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                                            <option value="Cash">Cash</option>
                                            <option value="UPI / Online">UPI / Online</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                            <option value="Cheque">Cheque</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" style={{ width: '100%', padding: '12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Add Student & Save</button>
                            </form>
                        )}

                        {selectedStudent.actionType === 'setFee' && (
                            <form onSubmit={handleSetTotalFee}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Total Required Fee for year (₹)</label>
                                    <input 
                                        type="number" value={newTotalFee} onChange={e => setNewTotalFee(e.target.value)}
                                        style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
                                        required min="0" placeholder="e.g. 50000"
                                    />
                                </div>
                                <button type="submit" style={{ width: '100%', padding: '12px', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Save Total Fee</button>
                            </form>
                        )}

                        {selectedStudent.actionType === 'history' && (
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {historyLoading ? <div style={{textAlign:'center'}}>Loading...</div> : 
                                 history.length === 0 ? <p style={{textAlign:'center', color:'#888'}}>No payments recorded yet.</p> :
                                 history.map(h => (
                                    <div key={h.id} style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '10px', borderLeft: '4px solid #28a745' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                            <strong style={{ fontSize: '1.1rem', color: '#28a745', display: 'flex', alignItems: 'center' }}>
                                                +₹{parseFloat(h.amount).toLocaleString()}
                                                {h.fee_month && <span style={{ fontSize: '0.8rem', color: '#666', background: '#e9ecef', padding: '2px 8px', borderRadius: '10px', marginLeft: '10px' }}>{h.fee_month}</span>}
                                            </strong>
                                            <span style={{ color: '#666', fontSize: '0.9rem' }}>{new Date(h.payment_date).toLocaleString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#555' }}>
                                            <span>Method: <strong>{h.payment_method}</strong></span>
                                            {h.remarks && <span style={{ fontStyle: 'italic' }}>"{h.remarks}"</span>}
                                        </div>
                                    </div>
                                 ))
                                }
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminFees;
