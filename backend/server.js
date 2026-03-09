const express = require('express');
const cors = require('cors');
const db = require('./db');
const jwt = require('jsonwebtoken');
const auth = require('./auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const smsService = require('./services/smsService');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer Configuration for Gallery Uploads
const galleryStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads', 'gallery');
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Create unique filename: timestamp-originalName
        cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
    }
});
const uploadGallery = multer({
    storage: galleryStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'), false);
        }
    }
});

// Multer Configuration for Alumni Uploads
const alumniStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads', 'alumni');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
    }
});
const uploadAlumni = multer({
    storage: alumniStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Not an image! Please upload an image.'), false);
    }
});

// ==========================================
// API Routes
// ==========================================

// 1. POST /apply - Submit admission form
app.post('/apply', async (req, res) => {
    try {
        const { name, email, phone, grade } = req.body;

        if (!name || !phone || !grade) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Generate a random 8-character alphanumeric tracking ID
        const trackingId = Math.random().toString(36).substring(2, 10).toUpperCase();

        const [result] = await db.query(
            'INSERT INTO students (name, email, phone, grade, tracking_id) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone, grade, trackingId]
        );

        res.status(201).json({
            message: 'Application submitted successfully',
            studentId: result.insertId,
            trackingId: trackingId
        });
    } catch (error) {
        console.error('Error in /apply:', error);
        res.status(500).json({ error: 'Database error while submitting application' });
    }
});

// 2. POST /admin/login - Authenticate admin
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;

    if (username === auth.ADMIN_CREDENTIALS.username && password === auth.ADMIN_CREDENTIALS.password) {
        // Sign token valid for 24 hours
        jwt.sign({ user: username }, auth.JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
            if (err) {
                console.error('Error generating token:', err);
                return res.status(500).json({ error: 'Error generating token' });
            }
            res.json({ token, message: 'Logged in successfully' });
        });
    } else {
        res.status(401).json({ error: 'Invalid username or password' });
    }
});

// 3. GET /students - Fetch all student records (Protected)
app.get('/students', auth.verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM students ORDER BY created_at DESC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error in /students:', error);
        res.status(500).json({ error: 'Database error while fetching students' });
    }
});

// 4. GET /admin/alerts - Fetch count of unread applications
app.get('/admin/alerts', auth.verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT COUNT(*) as unreadCount FROM students WHERE status = 'unread'");
        res.status(200).json({ unreadCount: rows[0].unreadCount });
    } catch (error) {
        console.error('Error in /admin/alerts:', error);
        res.status(500).json({ error: 'Database error while fetching alerts' });
    }
});

// 5. PUT /admin/mark-read/:id - Mark a specific application as read
app.put('/admin/mark-read/:id', auth.verifyToken, async (req, res) => {
    try {
        const studentId = req.params.id;
        await db.query("UPDATE students SET status = 'read' WHERE id = ?", [studentId]);
        res.status(200).json({ message: 'Application marked as read' });
    } catch (error) {
        console.error('Error in /admin/mark-read:', error);
        res.status(500).json({ error: 'Database error while updating status' });
    }
});

// 6. PUT /admin/application-stage/:id - Update the stage of an application
app.put('/admin/application-stage/:id', auth.verifyToken, async (req, res) => {
    try {
        const studentId = req.params.id;
        const { stage } = req.body;
        await db.query("UPDATE students SET application_stage = ? WHERE id = ?", [stage, studentId]);
        res.status(200).json({ message: 'Application stage updated' });
    } catch (error) {
        console.error('Error in /admin/application-stage:', error);
        res.status(500).json({ error: 'Database error while updating application stage' });
    }
});

// 7. GET /admissions/track/:trackingId - Track an application
app.get('/admissions/track/:trackingId', async (req, res) => {
    try {
        const { trackingId } = req.params;
        const [rows] = await db.query('SELECT name, grade, application_stage, created_at FROM students WHERE tracking_id = ?', [trackingId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'No application found with this tracking ID' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error in /admissions/track:', error);
        res.status(500).json({ error: 'Database error while tracking application' });
    }
});

// 8. GET /events - Fetch all events
app.get('/events', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM events ORDER BY date ASC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error in /events:', error);
        res.status(500).json({ error: 'Database error while fetching events' });
    }
});

// 9. POST /events - Create a new event (Admin)
app.post('/events', auth.verifyToken, async (req, res) => {
    try {
        const { title, date, time, location, description, type } = req.body;

        if (!title || !date) {
            return res.status(400).json({ error: 'Title and date are required' });
        }

        // Validate date to prevent database year out-of-range errors
        const parsedDate = new Date(date);
        if (parsedDate.getFullYear() > 9999 || parsedDate.getFullYear() < 1000) {
            return res.status(400).json({ error: 'Invalid date year. Please enter a valid 4-digit year.' });
        }

        const [result] = await db.query(
            'INSERT INTO events (title, date, time, location, description, type) VALUES (?, ?, ?, ?, ?, ?)',
            [title, date, time, location, description, type || 'General']
        );

        res.status(201).json({ message: 'Event created successfully', eventId: result.insertId });
    } catch (error) {
        console.error('Error in POST /events:', error);
        res.status(500).json({ error: 'Database error while creating event' });
    }
});

// 10. DELETE /events/:id - Delete an event (Admin)
app.delete('/events/:id', auth.verifyToken, async (req, res) => {
    try {
        const eventId = req.params.id;
        await db.query('DELETE FROM events WHERE id = ?', [eventId]);
        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error in DELETE /events:', error);
        res.status(500).json({ error: 'Database error while deleting event' });
    }
});

// 11. GET /settings/announcement - Fetch current announcement (Public)
app.get('/settings/announcement', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT setting_value as text, is_active FROM settings WHERE setting_key = 'announcement'");
        if (rows.length === 0) {
            return res.status(200).json({ text: '', is_active: false }); // Fallback defaults
        }
        res.status(200).json({ text: rows[0].text, is_active: !!rows[0].is_active });
    } catch (error) {
        console.error('Error in GET /settings/announcement:', error);
        res.status(500).json({ error: 'Database error while fetching announcement' });
    }
});

// 12. PUT /settings/announcement - Update announcement (Admin)
app.put('/settings/announcement', auth.verifyToken, async (req, res) => {
    try {
        const { text, is_active } = req.body;

        // Ensure the setting exists before attempting update/insert
        await db.query(`
            INSERT INTO settings (setting_key, setting_value, is_active) 
            VALUES ('announcement', ?, ?) 
            ON DUPLICATE KEY UPDATE setting_value = ?, is_active = ?
        `, [text, is_active ? 1 : 0, text, is_active ? 1 : 0]);

        // If the announcement is being activated, send an SMS to all registered student numbers
        if (is_active && text) {
            // Offload the heavy SMS broadcasting loop to the dedicated service module
            smsService.broadcastAnnouncementSMS(db, text);
        }

        res.status(200).json({ message: 'Announcement updated and messages sent successfully' });
    } catch (error) {
        console.error('Error in PUT /settings/announcement:', error);
        res.status(500).json({ error: 'Database error while updating announcement' });
    }
});

// 13. POST /admin/send-sms - Direct SMS Sending (Admin)
app.post('/admin/send-sms', auth.verifyToken, async (req, res) => {
    try {
        const { phone, message } = req.body;
        if (!phone || !message) {
            return res.status(400).json({ error: 'Phone number and message are required' });
        }
        
        // Pass off to MSG91 service
        const success = await smsService.sendSMS(phone, message);
        if (success) {
            res.status(200).json({ message: 'SMS request sent to MSG91 successfully' });
        } else {
            res.status(500).json({ error: 'Failed to send SMS via MSG91' });
        }
    } catch (error) {
        console.error('Error in POST /admin/send-sms:', error);
        res.status(500).json({ error: 'Server error while sending SMS' });
    }
});

// 14. GET /teachers - Fetch all teachers (Public)
app.get('/teachers', async (req, res) => {
    try {
        const [teachers] = await db.query('SELECT * FROM teachers ORDER BY created_at DESC');
        res.status(200).json(teachers);
    } catch (error) {
        console.error('Error in GET /teachers:', error);
        res.status(500).json({ error: 'Database error while fetching teachers' });
    }
});

// 14. POST /teachers - Add a new teacher (Admin)
app.post('/teachers', auth.verifyToken, async (req, res) => {
    try {
        const { name, subject, qualification, image_url } = req.body;

        if (!name || !subject || !qualification) {
            return res.status(400).json({ error: 'Name, subject, and qualification are required' });
        }

        const fallbackImage = image_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';

        const [result] = await db.query(
            'INSERT INTO teachers (name, subject, qualification, image_url) VALUES (?, ?, ?, ?)',
            [name, subject, qualification, fallbackImage]
        );
        res.status(201).json({ message: 'Teacher added successfully', id: result.insertId });
    } catch (error) {
        console.error('Error in POST /teachers:', error);
        res.status(500).json({ error: 'Database error while saving teacher' });
    }
});

// 15. DELETE /teachers/:id - Delete a teacher (Admin)
app.delete('/teachers/:id', auth.verifyToken, async (req, res) => {
    try {
        const teacherId = req.params.id;
        await db.query('DELETE FROM teachers WHERE id = ?', [teacherId]);
        res.status(200).json({ message: 'Teacher removed successfully' });
    } catch (error) {
        console.error('Error in DELETE /teachers:', error);
        res.status(500).json({ error: 'Database error while deleting teacher' });
    }
});

// 16. GET /gallery - Fetch all gallery images (Public)
app.get('/gallery', async (req, res) => {
    try {
        const [images] = await db.query('SELECT * FROM gallery ORDER BY created_at DESC');
        res.status(200).json(images);
    } catch (error) {
        console.error('Error in GET /gallery:', error);
        res.status(500).json({ error: 'Database error while fetching gallery' });
    }
});

// 17. POST /gallery - Upload a new image (Admin)
app.post('/gallery', auth.verifyToken, uploadGallery.single('image'), async (req, res) => {
    try {
        const { title, category } = req.body;

        if (!title || !category || !req.file) {
            return res.status(400).json({ error: 'Title, category, and image file are required' });
        }

        // Store the relative path to be served by express.static
        const imagePath = `/uploads/gallery/${req.file.filename}`;

        const [result] = await db.query(
            'INSERT INTO gallery (title, category, image_path) VALUES (?, ?, ?)',
            [title, category, imagePath]
        );
        res.status(201).json({ message: 'Image uploaded successfully', id: result.insertId });
    } catch (error) {
        console.error('Error in POST /gallery:', error);
        // Clean up uploaded file if DB insert fails
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Failed to clean up file after DB error:', err);
            });
        }
        res.status(500).json({ error: error.message || 'Error occurred while uploading image' });
    }
});

// 18. DELETE /gallery/:id - Delete an image (Admin)
app.delete('/gallery/:id', auth.verifyToken, async (req, res) => {
    try {
        const imageId = req.params.id;

        // Find the image path first
        const [rows] = await db.query('SELECT image_path FROM gallery WHERE id = ?', [imageId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Image not found' });
        }

        const imagePath = rows[0].image_path;

        // Delete from database
        await db.query('DELETE FROM gallery WHERE id = ?', [imageId]);

        // Remove physical file
        const fullPath = path.join(__dirname, imagePath);
        fs.unlink(fullPath, (err) => {
            if (err && err.code !== 'ENOENT') {
                console.error(`Error removing physical file ${fullPath}:`, err);
                // Don't send error response here, DB deletion succeeded
            }
        });

        res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Error in DELETE /gallery:', error);
        res.status(500).json({ error: 'Database error while deleting image' });
    }
});

// 19. POST /student/login - Authenticate student
app.post('/student/login', async (req, res) => {
    try {
        const { email, trackingId } = req.body;

        if (!email || !trackingId) {
            return res.status(400).json({ error: 'Email and Tracking ID are required' });
        }

        const [rows] = await db.query(
            "SELECT id, name, email FROM students WHERE email = ? AND tracking_id = ? AND application_stage = 'Admitted'",
            [email, trackingId]
        );

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials or you have not been admitted yet.' });
        }

        const student = rows[0];

        // Sign student token valid for 24 hours
        jwt.sign({ id: student.id, email: student.email, name: student.name, role: 'student' }, auth.JWT_SECRET, { expiresIn: '1d' }, (err, token) => {
            if (err) {
                console.error('Error generating student token:', err);
                return res.status(500).json({ error: 'Error generating token' });
            }
            res.json({ token, message: 'Logged in successfully', student: { name: student.name } });
        });

    } catch (error) {
        console.error('Error in /student/login:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// 20. GET /student/dashboard - Fetch student records (Protected for Students)
app.get('/student/dashboard', auth.verifyStudentToken, async (req, res) => {
    try {
        const studentId = req.studentData.id;

        // Fetch student info
        const [studentRows] = await db.query("SELECT id, name, email, phone, grade FROM students WHERE id = ?", [studentId]);
        if (studentRows.length === 0) return res.status(404).json({ error: 'Student not found' });

        // Fetch academic records
        const [academicRows] = await db.query("SELECT attendance_percentage, gpa, remarks FROM academic_records WHERE student_id = ?", [studentId]);

        const dashboardData = {
            profile: studentRows[0],
            academics: academicRows.length > 0 ? academicRows[0] : { attendance_percentage: 0, gpa: 0.00, remarks: 'No academic records available yet.' }
        };

        res.status(200).json(dashboardData);
    } catch (error) {
        console.error('Error in GET /student/dashboard:', error);
        res.status(500).json({ error: 'Database error while fetching dashboard' });
    }
});

// 21. POST /admin/academics - Create or update student academics (Admin)
app.post('/admin/academics', auth.verifyToken, async (req, res) => {
    try {
        const { studentId, attendance_percentage, gpa, remarks } = req.body;

        if (!studentId) {
            return res.status(400).json({ error: 'Student ID is required' });
        }

        await db.query(`
            INSERT INTO academic_records (student_id, attendance_percentage, gpa, remarks) 
            VALUES (?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE 
            attendance_percentage = VALUES(attendance_percentage), 
            gpa = VALUES(gpa), 
            remarks = VALUES(remarks)
        `, [studentId, attendance_percentage, gpa, remarks]);

        res.status(200).json({ message: 'Academic records updated successfully' });
    } catch (error) {
        console.error('Error in POST /admin/academics:', error);
        res.status(500).json({ error: 'Database error while updating academics' });
    }
});

// 22. GET /admin/academics/:studentId - Get academics for admin view
app.get('/admin/academics/:studentId', auth.verifyToken, async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const [rows] = await db.query("SELECT attendance_percentage, gpa, remarks FROM academic_records WHERE student_id = ?", [studentId]);

        if (rows.length === 0) {
            return res.status(200).json({ attendance_percentage: 0, gpa: 0, remarks: '' });
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Error in GET /admin/academics/:id:', error);
        res.status(500).json({ error: 'Database error while fetching academics' });
    }
});

// 23. POST /student/leave - Apply for leave
app.post('/student/leave', auth.verifyStudentToken, async (req, res) => {
    try {
        const studentId = req.studentData.id;
        const { start_date, end_date, reason } = req.body;

        if (!start_date || !end_date || !reason) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        await db.query(
            "INSERT INTO leave_requests (student_id, start_date, end_date, reason) VALUES (?, ?, ?, ?)",
            [studentId, start_date, end_date, reason]
        );
        res.status(201).json({ message: 'Leave request submitted successfully' });
    } catch (error) {
        console.error('Error in POST /student/leave:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// 24. GET /student/leave - Get student leaves
app.get('/student/leave', auth.verifyStudentToken, async (req, res) => {
    try {
        const studentId = req.studentData.id;
        const [rows] = await db.query("SELECT * FROM leave_requests WHERE student_id = ? ORDER BY created_at DESC", [studentId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error in GET /student/leave:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// 25. GET /admin/leaves - Get all leave requests
app.get('/admin/leaves', auth.verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT l.*, s.name, s.grade, s.phone FROM leave_requests l JOIN students s ON l.student_id = s.id ORDER BY l.created_at DESC"
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error in GET /admin/leaves:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// 26. PUT /admin/leave/:id - Approve or Reject Leave
app.put('/admin/leave/:id', auth.verifyToken, async (req, res) => {
    try {
        const leaveId = req.params.id;
        const { status } = req.body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        await db.query("UPDATE leave_requests SET status = ? WHERE id = ?", [status, leaveId]);

        // Fetch the updated request and send SMS
        const [rows] = await db.query(
            "SELECT l.start_date, l.end_date, s.phone, s.name FROM leave_requests l JOIN students s ON l.student_id = s.id WHERE l.id = ?",
            [leaveId]
        );

        if (rows.length > 0 && rows[0].phone && process.env.MSG91_AUTH_KEY) {
            // Format dates
            const sd = new Date(rows[0].start_date).toLocaleDateString();
            const ed = new Date(rows[0].end_date).toLocaleDateString();
            const msg = `Hi ${rows[0].name}, your leave request from ${sd} to ${ed} has been ${status}.`;
            smsService.sendSMS(rows[0].phone, msg).catch(err => console.error("Error sending SMS:", err));
        }

        res.status(200).json({ message: `Leave ${status}` });
    } catch (error) {
        console.error('Error in PUT /admin/leave/:id:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// 27. GET /admin/fees - Fetch all students in the standalone fee system
app.get('/admin/fees', auth.verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM fee_accounts ORDER BY created_at DESC");
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error in GET /admin/fees:', error);
        res.status(500).json({ error: 'Database error while fetching fees' });
    }
});

// 28. POST /admin/fees/set - Set total fee for an account
app.post('/admin/fees/set', auth.verifyToken, async (req, res) => {
    try {
        const { studentId, total_fee } = req.body;
        if (!studentId || total_fee === undefined) return res.status(400).json({ error: 'Student ID and total fee are required' });

        await db.query("UPDATE fee_accounts SET total_fee = ? WHERE id = ?", [total_fee, studentId]);

        res.status(200).json({ message: 'Total fee updated successfully' });
    } catch (error) {
        console.error('Error in POST /admin/fees/set:', error);
        res.status(500).json({ error: 'Database error updating fee' });
    }
});

// 29. POST /admin/fees/pay - Record a fee payment
app.post('/admin/fees/pay', auth.verifyToken, async (req, res) => {
    try {
        const { studentId, amount, payment_method, remarks, fee_month } = req.body;
        if (!studentId || !amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ error: 'Valid Account ID and amount are required' });
        }

        // 1. Record payment history
        await db.query(
            "INSERT INTO fee_transactions (account_id, amount, payment_method, remarks, fee_month) VALUES (?, ?, ?, ?, ?)",
            [studentId, amount, payment_method || 'Cash', remarks || '', fee_month || '']
        );

        // 2. Update total amount paid in fee_accounts
        await db.query("UPDATE fee_accounts SET amount_paid = amount_paid + ? WHERE id = ?", [amount, studentId]);

        // 3. Send SMS Receipt
        const [accountRows] = await db.query("SELECT name, phone FROM fee_accounts WHERE id = ?", [studentId]);
        if (accountRows.length > 0 && accountRows[0].phone) {
            const { name, phone } = accountRows[0];
            const monthText = fee_month ? ` for ${fee_month}` : '';
            const message = `Dear ${name}, we have received your fee payment of Rs. ${amount}${monthText} via ${payment_method}. Thank you! - EduConnect`;
            if (process.env.MSG91_AUTH_KEY) {
                const smsService = require('./services/smsService');
                smsService.sendSMS(phone, message).catch(err => console.error("Error sending Fee SMS:", err));
            }
        }

        res.status(200).json({ message: 'Payment recorded successfully' });
    } catch (error) {
        console.error('Error in POST /admin/fees/pay:', error);
        res.status(500).json({ error: 'Database error processing payment' });
    }
});

// 30. GET /admin/fees/history/:studentId - Get payment history
app.get('/admin/fees/history/:studentId', auth.verifyToken, async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const [rows] = await db.query(
            "SELECT id, account_id, amount, payment_method, remarks, fee_month, created_at AS payment_date FROM fee_transactions WHERE account_id = ? ORDER BY created_at DESC",
            [studentId]
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error in GET /admin/fees/history:', error);
        res.status(500).json({ error: 'Database error fetching history' });
    }
});

// 31. POST /admin/fees/walk-in - Add a standalone student to Fee system
app.post('/admin/fees/walk-in', auth.verifyToken, async (req, res) => {
    try {
        const { name, reg_number, phone, grade, amount, payment_method, remarks, fee_month } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        // Just create the fee account. No need to touch admissions students at all!
        const [result] = await db.query(
            "INSERT INTO fee_accounts (name, reg_number, phone, grade, total_fee, amount_paid) VALUES (?, ?, ?, ?, ?, ?)",
            [name, reg_number || '', phone || '', grade || 'General', 0, 0]
        );
        const accountId = result.insertId;

        // If amount was provided, log a payment
        if (amount && parseFloat(amount) > 0) {
            await db.query(
                "INSERT INTO fee_transactions (account_id, amount, payment_method, remarks, fee_month) VALUES (?, ?, ?, ?, ?)",
                [accountId, amount, payment_method || 'Cash', remarks || 'Initial Payment', fee_month || '']
            );
            await db.query("UPDATE fee_accounts SET amount_paid = amount_paid + ? WHERE id = ?", [amount, accountId]);
            
            if (phone && process.env.MSG91_AUTH_KEY) {
                const smsService = require('./services/smsService');
                const monthText = fee_month ? ` for ${fee_month}` : '';
                const message = `Dear ${name}, we have received your direct fee payment of Rs. ${amount}${monthText} via ${payment_method || 'Cash'}. Thank you! - EduConnect`;
                smsService.sendSMS(phone, message).catch(err => console.log('Silently failing SMS on walk-in:', err));
            }
            res.status(200).json({ message: 'Account created and payment recorded successfully' });
        } else {
            res.status(200).json({ message: 'Fee Account created successfully' });
        }
    } catch (error) {
        console.error('Error in POST /admin/fees/walk-in:', error);
        res.status(500).json({ error: 'Database error creating standalone account' });
    }
});

// 31b. DELETE /admin/fees/:id - Delete a fee account
app.delete('/admin/fees/:id', auth.verifyToken, async (req, res) => {
    try {
        const studentId = req.params.id;
        await db.query("DELETE FROM fee_transactions WHERE account_id = ?", [studentId]);
        const [result] = await db.query("DELETE FROM fee_accounts WHERE id = ?", [studentId]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Account not found' });
        res.status(200).json({ message: 'Fee account deleted successfully' });
    } catch (error) {
        console.error('Error in DELETE /admin/fees/:id:', error);
        res.status(500).json({ error: 'Database error deleting account' });
    }
});

// 32. GET /alumni - Fetch all Alumni success stories (Public)
app.get('/alumni', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM alumni ORDER BY batch_year DESC, created_at DESC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error in GET /alumni:', error);
        res.status(500).json({ error: 'Database error fetching alumni' });
    }
});

// 33. POST /admin/alumni - Add an Alumni profile (Admin)
app.post('/admin/alumni', auth.verifyToken, uploadAlumni.single('image'), async (req, res) => {
    try {
        const { name, batch_year, achievement, current_position } = req.body;
        
        if (!name || !batch_year || !achievement || !req.file) {
            return res.status(400).json({ error: 'Name, Batch Year, Achievement, and Image are required' });
        }

        const imagePath = `/uploads/alumni/${req.file.filename}`;

        const [result] = await db.query(
            "INSERT INTO alumni (name, batch_year, achievement, current_position, image_path) VALUES (?, ?, ?, ?, ?)",
            [name, parseInt(batch_year), achievement, current_position || '', imagePath]
        );
        res.status(201).json({ message: 'Alumni added successfully', id: result.insertId });
    } catch (error) {
        console.error('Error in POST /admin/alumni:', error);
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if(err) console.error('Failed to cleanup file:', err);
            });
        }
        res.status(500).json({ error: 'Database error adding alumni' });
    }
});

// 34. DELETE /admin/alumni/:id - Delete an Alumni profile
app.delete('/admin/alumni/:id', auth.verifyToken, async (req, res) => {
    try {
        const alumniId = req.params.id;
        
        // Find image path
        const [rows] = await db.query('SELECT image_path FROM alumni WHERE id = ?', [alumniId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Alumni not found' });
        
        const imagePath = rows[0].image_path;
        await db.query('DELETE FROM alumni WHERE id = ?', [alumniId]);
        
        // Delete physical file
        const fullPath = path.join(__dirname, imagePath);
        fs.unlink(fullPath, err => {
            if (err && err.code !== 'ENOENT') console.error(`Error deleting image ${fullPath}:`, err);
        });

        res.status(200).json({ message: 'Alumni removed successfully' });
    } catch (error) {
        console.error('Error in DELETE /admin/alumni:', error);
        res.status(500).json({ error: 'Database error deleting alumni' });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
