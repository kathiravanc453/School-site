import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './FeeTracking.css';

const FeeTracking = () => {
    const [feeReg, setFeeReg] = useState('');
    const [feePhone, setFeePhone] = useState('');
    const [feeData, setFeeData] = useState(null);
    const [feeError, setFeeError] = useState('');
    const [payAmount, setPayAmount] = useState('');
    const [payMonth, setPayMonth] = useState('');
    const [payStatus, setPayStatus] = useState({ type: '', text: '' });
    const [paying, setPaying] = useState(false);

    const handleFeeTrackSubmit = async (e) => {
        e.preventDefault();
        setFeeError('');
        setFeeData(null);

        if (!feeReg.trim() || !feePhone.trim()) {
            setFeeError('Please enter your Student Name or Roll Number and Phone Number.');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/fees/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: feeReg.trim(), phone: feePhone.trim() })
            });
            const data = await response.json();

            if (response.ok) {
                setFeeData(data);
            } else {
                setFeeError(data.error || 'No records found.');
            }
        } catch (error) {
            setFeeError('Failed to connect to the server.');
        }
    };

    const downloadFeePDF = () => {
        if (!feeData) return;
        
        const doc = new jsPDF();
        const { account, history } = feeData;
        
        // Title
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text(`Fee Receipt & History`, 14, 22);
        
        // Subtitle details
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Student: ${account.name} | Roll No: ${account.reg_number || 'N/A'} | Grade: ${account.grade}`, 14, 30);
        doc.text(`Total Fee: Rs. ${parseFloat(account.total_fee).toLocaleString()} | Paid: Rs. ${parseFloat(account.amount_paid).toLocaleString()}`, 14, 36);
        doc.text(`Report Generated: ${new Date().toLocaleString()}`, 14, 42);

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
            startY: 48,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [39, 174, 96] },
            alternateRowStyles: { fillColor: [248, 249, 250] },
            margin: { top: 48 }
        });

        // Save
        doc.save(`${account.name.replace(/\s+/g, '_')}_fee_receipt.pdf`);
    };

    const handlePayOnline = async () => {
        if (!payAmount || parseFloat(payAmount) <= 0) {
            setPayStatus({ type: 'error', text: 'Please enter a valid amount to pay.' });
            return;
        }
        setPaying(true);
        setPayStatus({ type: '', text: 'Creating your payment order...' });

        try {
            // Step 1: Create order from backend
            const orderRes = await fetch('http://localhost:5000/fees/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ account_id: feeData.account.id, amount: payAmount })
            });
            const orderData = await orderRes.json();

            if (!orderRes.ok) {
                setPayStatus({ type: 'error', text: orderData.error || 'Failed to create order.' });
                setPaying(false);
                return;
            }

            // Step 2: Open Razorpay checkout popup
            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'Annai Therasa Hr Sec School',
                description: `Fee Payment${payMonth ? ' - ' + payMonth : ''}`,
                order_id: orderData.order_id,
                handler: async (response) => {
                    // Step 3: Verify payment on backend
                    try {
                        const verifyRes = await fetch('http://localhost:5000/fees/verify-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                account_id: feeData.account.id,
                                amount: payAmount,
                                fee_month: payMonth
                            })
                        });
                        const verifyData = await verifyRes.json();

                        if (verifyRes.ok) {
                            setPayStatus({ type: 'success', text: `✅ Payment of ₹${payAmount} successful! Payment ID: ${response.razorpay_payment_id}` });
                            // Refresh fee data
                            const newPaid = parseFloat(feeData.account.amount_paid) + parseFloat(payAmount);
                            setFeeData(prev => ({
                                ...prev,
                                account: { ...prev.account, amount_paid: newPaid.toString() }
                            }));
                            setPayAmount('');
                            setPayMonth('');
                        } else {
                            setPayStatus({ type: 'error', text: verifyData.error || 'Payment verification failed.' });
                        }
                    } catch {
                        setPayStatus({ type: 'error', text: 'Server error during verification.' });
                    }
                    setPaying(false);
                },
                prefill: {
                    name: feeData.account.name,
                    contact: feeData.account.phone
                },
                theme: { color: '#27ae60' },
                modal: { ondismiss: () => { setPaying(false); setPayStatus({ type: '', text: '' }); } }
            };

            // Load Razorpay script if not already loaded
            if (!window.Razorpay) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.body.appendChild(script);
                });
            }

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch {
            setPayStatus({ type: 'error', text: 'Could not open payment gateway. Check your connection.' });
            setPaying(false);
        }
    };

    return (
        <section className="fee-tracking-section">
            <div className="fee-tracking-container">
                <h2 className="fee-tracking-title">Track & Download Fee Receipt</h2>
                <p className="fee-tracking-subtitle">Securely verify your fee status and download historical payment receipts.</p>
                
                <form onSubmit={handleFeeTrackSubmit} className="tracking-form">
                    <input
                        type="text"
                        placeholder="Student Name or Roll Number"
                        value={feeReg}
                        onChange={(e) => setFeeReg(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Registered Phone Number"
                        value={feePhone}
                        onChange={(e) => setFeePhone(e.target.value)}
                    />
                    <button type="submit" className="btn-track">Track Fees</button>
                </form>

                {feeError && <div className="alert alert-error" style={{marginBottom: '20px'}}>{feeError}</div>}

                {feeData && (
                    <div className="fee-result-card">
                        <h4 className="student-name">
                            {feeData.account.name}
                            {feeData.account.reg_number && (
                                <span style={{ fontSize: '0.85rem', fontWeight: '500', color: '#718096', background: '#edf2f7', padding: '3px 10px', borderRadius: '20px' }}>
                                    Roll No: {feeData.account.reg_number}
                                </span>
                            )}
                        </h4>
                        <div className="fee-details">
                            <div className="fee-stat">
                                <span>Total Fee</span>
                                <strong>₹{parseFloat(feeData.account.total_fee).toLocaleString()}</strong>
                            </div>
                            <div className="fee-stat">
                                <span>Paid Amount</span>
                                <strong style={{color: '#28a745'}}>₹{parseFloat(feeData.account.amount_paid).toLocaleString()}</strong>
                            </div>
                            <div className="fee-stat">
                                <span>Balance Due</span>
                                <strong style={{color: (parseFloat(feeData.account.total_fee) - parseFloat(feeData.account.amount_paid) > 0) ? '#dc3545' : '#28a745' }}>
                                    ₹{(parseFloat(feeData.account.total_fee) - parseFloat(feeData.account.amount_paid)).toLocaleString()}
                                </strong>
                            </div>
                        </div>
                        
                        <button onClick={downloadFeePDF} className="btn-download">
                            <i className="fa-regular fa-file-pdf"></i> Download PDF Receipt
                        </button>

                        {/* ── Pay Online Section ── */}
                        <div style={{ marginTop: '25px', padding: '20px', background: '#fff', border: '2px solid #27ae60', borderRadius: '10px' }}>
                            <h5 style={{ margin: '0 0 15px 0', color: '#27ae60', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                💳 Pay Fees Online
                            </h5>

                            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Enter amount (₹)"
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(e.target.value)}
                                    style={{ flex: 1, minWidth: '130px', padding: '10px 12px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '0.95rem' }}
                                />
                                <select
                                    value={payMonth}
                                    onChange={(e) => setPayMonth(e.target.value)}
                                    style={{ flex: 1, minWidth: '130px', padding: '10px 12px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '0.95rem', background: '#fff' }}
                                >
                                    <option value="">-- Select Month (Optional) --</option>
                                    {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handlePayOnline}
                                disabled={paying}
                                style={{
                                    width: '100%', padding: '12px', border: 'none', borderRadius: '8px',
                                    background: paying ? '#ccc' : '#27ae60', color: '#fff',
                                    fontSize: '1rem', fontWeight: '700', cursor: paying ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                {paying ? '⏳ Processing...' : '🔒 Pay Securely via Razorpay'}
                            </button>

                            {payStatus.text && (
                                <div style={{
                                    marginTop: '12px', padding: '10px 14px', borderRadius: '6px',
                                    background: payStatus.type === 'success' ? '#d4edda' : '#f8d7da',
                                    color: payStatus.type === 'success' ? '#155724' : '#721c24',
                                    fontSize: '0.9rem'
                                }}>
                                    {payStatus.text}
                                </div>
                            )}
                        </div>
                    </div>

                )}
            </div>
        </section>
    );
};

export default FeeTracking;
