const express = require('express');
const cors = require('cors');
const db = require('./db');
const jwt = require('jsonwebtoken');
const auth = require('./auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const smsService = require('./services/smsService');
require('dotenv').config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

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

        // Auto-connect student details to the fee system when they are Admitted
        if (stage === 'Admitted') {
            const [students] = await db.query("SELECT * FROM students WHERE id = ?", [studentId]);
            if (students.length > 0) {
                const s = students[0];
                // Check if they already exist to prevent duplicates
                const [existing] = await db.query("SELECT id FROM fee_accounts WHERE phone = ? AND name = ?", [s.phone, s.name]);
                if (existing.length === 0) {
                    await db.query(
                        "INSERT INTO fee_accounts (name, reg_number, phone, grade, total_fee, amount_paid) VALUES (?, ?, ?, ?, ?, ?)",
                        [s.name, s.tracking_id, s.phone, s.grade, 0, 0]
                    );
                }
            }
        }

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

// 13b. GET /admin/phones-by-grade - Fetch all phone numbers for a specific grade
app.get('/admin/phones-by-grade', auth.verifyToken, async (req, res) => {
    try {
        const { grade } = req.query;
        if (!grade) {
            return res.status(400).json({ error: 'Grade is required' });
        }
        
        let query = 'SELECT phone FROM students WHERE grade = ? AND phone IS NOT NULL AND phone != ""';
        let params = [grade];

        if (grade === 'All') {
            query = 'SELECT phone FROM students WHERE phone IS NOT NULL AND phone != ""';
            params = [];
        }

        const [rows] = await db.query(query, params);
        
        // Extract just the unique numbers
        const numbers = [...new Set(rows.map(r => r.phone))];
        
        res.status(200).json({ numbers });
    } catch (error) {
        console.error('Error fetching phones by grade:', error);
        res.status(500).json({ error: 'Database error fetching numbers' });
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
            const message = `Dear ${name}, we have received your fee payment of Rs. ${amount}${monthText} via ${payment_method}. Thank you! - Annai Therasa Hr Sec School`;
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
                const message = `Dear ${name}, we have received your direct fee payment of Rs. ${amount}${monthText} via ${payment_method || 'Cash'}. Thank you! - Annai Therasa Hr Sec School`;
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

// 31a. POST /fees/track - Parent tracking fees securely
app.post('/fees/track', async (req, res) => {
    try {
        const { identifier, phone } = req.body;
        if (!identifier || !phone) {
            return res.status(400).json({ error: 'Student Name/Roll No and Phone Number are required' });
        }

        const [accounts] = await db.query(
            "SELECT id, name, reg_number, phone, grade, total_fee, amount_paid FROM fee_accounts WHERE (reg_number = ? OR name LIKE ?) AND phone = ?",
            [identifier.trim(), `%${identifier.trim()}%`, phone.trim()]
        );

        if (accounts.length === 0) {
            return res.status(404).json({ error: 'No fee records found. Please check your Roll Number and Phone Number.' });
        }

        const account = accounts[0];

        const [history] = await db.query(
            "SELECT id, amount, payment_method, remarks, fee_month, created_at AS payment_date FROM fee_transactions WHERE account_id = ? ORDER BY created_at DESC",
            [account.id]
        );

        res.status(200).json({ account, history });
    } catch (error) {
        console.error('Error tracking fees:', error);
        res.status(500).json({ error: 'Database error fetching fee records' });
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

// 35. GET /admin/staff-attendance - Fetch staff attendance for a specific date
app.get('/admin/staff-attendance', auth.verifyToken, async (req, res) => {
    try {
        const date = req.query.date; // Should be YYYY-MM-DD
        if (!date) {
             return res.status(400).json({ error: 'Date is required' });
        }
        
        // Return left join of teachers and their attendance for the given date (now including punches)
        const query = `
            SELECT t.id as teacher_id, t.name, t.subject, t.image_url, 
                   sa.status, sa.remarks, sa.punch_in, sa.punch_out
            FROM teachers t
            LEFT JOIN staff_attendance sa ON t.id = sa.teacher_id AND sa.date = ?
            ORDER BY t.name ASC
        `;
        const [rows] = await db.query(query, [date]);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error in GET /admin/staff-attendance:', error);
        res.status(500).json({ error: 'Database error fetching staff attendance' });
    }
});

// 36. POST /api/biometric - Hardware connection endpoint for biometric devices
app.post('/api/biometric', async (req, res) => {
    try {
        // Typically biometric devices post an ID (user id) and a timestamp
        const { teacher_id, timestamp } = req.body;
        
        if (!teacher_id) {
            return res.status(400).json({ error: 'Missing teacher_id from biometric device' });
        }
        
        const dateObj = timestamp ? new Date(timestamp) : new Date();
        const dateStr = dateObj.toISOString().split('T')[0];
        
        // Convert to local time string, format HH:MM:SS
        const timeStr = dateObj.toTimeString().split(' ')[0];

        // Check if there's already an attendance record for this teacher today
        const [existing] = await db.query(
            "SELECT * FROM staff_attendance WHERE teacher_id = ? AND date = ?", 
            [teacher_id, dateStr]
        );

        if (existing.length === 0) {
            // First punch -> Punch In & Default status to 'Present'
            await db.query(`
                INSERT INTO staff_attendance (teacher_id, date, status, punch_in) 
                VALUES (?, ?, 'Present', ?)
            `, [teacher_id, dateStr, timeStr]);
            res.status(200).json({ message: 'Punch-in successfully recorded' });
        } else {
            // Second/subsequent punch -> Update Punch Out & Override Status to Present
            // This ensures if an admin marked them 'Leave' or 'Absent', physical interaction overrides it to Present
            await db.query(`
                UPDATE staff_attendance 
                SET punch_out = ?, status = 'Present'
                WHERE teacher_id = ? AND date = ?
            `, [timeStr, teacher_id, dateStr]);
            res.status(200).json({ message: 'Punch-out successfully recorded & status updated' });
        }
    } catch (error) {
        console.error('Error in Biometric Webhook /api/biometric:', error);
        res.status(500).json({ error: 'Server error processing biometric log' });
    }
});

// 36. POST /admin/staff-attendance - Save daily staff attendance
app.post('/admin/staff-attendance', auth.verifyToken, async (req, res) => {
    try {
        const { date, attendanceData } = req.body;
        if (!date || !attendanceData || !Array.isArray(attendanceData)) {
            return res.status(400).json({ error: 'Date and attendance data array are required' });
        }

        // Process each attendance record
        for (const record of attendanceData) {
            const { teacher_id, status, remarks } = record;
            
            // basic validation
            if (!teacher_id || !status) continue;

            await db.query(`
                INSERT INTO staff_attendance (teacher_id, date, status, remarks) 
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                status = VALUES(status), 
                remarks = VALUES(remarks)
            `, [teacher_id, date, status, remarks || '']);
        }

        res.status(200).json({ message: 'Staff attendance saved successfully' });
    } catch (error) {
        console.error('Error in POST /admin/staff-attendance:', error);
        res.status(500).json({ error: 'Database error saving staff attendance' });
    }
});

// 37. GET /admin/staff-attendance/report/:id - Get 30-day biometric report for a teacher
app.get('/admin/staff-attendance/report/:id', auth.verifyToken, async (req, res) => {
    try {
        const teacher_id = req.params.id;
        // Fetch the last 30 days of records
        const [rows] = await db.query(`
            SELECT date, status, punch_in, punch_out, remarks
            FROM staff_attendance 
            WHERE teacher_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            ORDER BY date ASC
        `, [teacher_id]);

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching staff report:', error);
        res.status(500).json({ error: 'Database error fetching report' });
    }
});

//==========================================
// Student Grading & Exam Results
//==========================================

// 37b. POST /admin/grading/add-student - Manually add a student for grading
app.post('/admin/grading/add-student', auth.verifyToken, async (req, res) => {
    try {
        const { name, grade, roll_number, dob } = req.body;
        if (!name || !grade || !roll_number || !dob) {
            return res.status(400).json({ error: 'Name, grade, roll number, and date of birth are required' });
        }
        
        await db.query(`
            INSERT INTO students (name, email, phone, grade, status, application_stage, roll_number, dob) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [name, null, 'N/A', grade, 'read', 'Approved', roll_number, dob]);
        
        res.status(200).json({ message: 'Student added successfully' });
    } catch (err) {
        console.error('Error adding manual student:', err);
        res.status(500).json({ error: 'Failed to add student. Roll number might already exist.' });
    }
});

// 38. GET /admin/active-students - Get students explicitly for grading (Admitted ones)
app.get('/admin/active-students', auth.verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name, grade, roll_number, dob FROM students ORDER BY grade, name ASC');
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching students for exams:', err);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// 39. GET /admin/exams/:student_id - Get exam results for student
app.get('/admin/exams/:student_id', auth.verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM exam_results WHERE student_id = ? ORDER BY exam_term, subject', [req.params.student_id]);
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error fetching exam results:', err);
        res.status(500).json({ error: 'Failed to fetch exam results' });
    }
});

// 39b. POST /exams/student/results - Public endpoint to get results
app.post('/exams/student/results', async (req, res) => {
    try {
        const { name, roll_number, dob, grade } = req.body;
        if (!name || !roll_number || !dob || !grade) return res.status(400).json({ error: 'Name, Class, Roll number and Date of Birth required' });

        const [studentRows] = await db.query('SELECT id, name, grade, roll_number, dob FROM students WHERE name = ? AND roll_number = ? AND dob = ? AND grade = ?', [name, roll_number, dob, grade]);
        if (studentRows.length === 0) return res.status(404).json({ error: 'Student not found. Check Name, Class, Roll Number and Date of Birth.' });
        
        const studentId = studentRows[0].id;
        const [examRows] = await db.query('SELECT * FROM exam_results WHERE student_id = ? ORDER BY exam_term, subject', [studentId]);
        
        res.status(200).json({ student: studentRows[0], results: examRows });
    } catch (err) {
        console.error('Error fetching public exam results:', err);
        res.status(500).json({ error: 'Failed to fetch exam results' });
    }
});

// 40. POST /admin/exams/:student_id - Save exam results
app.post('/admin/exams/:student_id', auth.verifyToken, async (req, res) => {
    try {
        const student_id = req.params.student_id;
        const { exam_term, subject, marks_obtained, remarks } = req.body;
        
        if (!exam_term || !subject || marks_obtained === undefined) {
            return res.status(400).json({ error: 'Missing required exam fields' });
        }

        await db.query(`
            INSERT INTO exam_results (student_id, exam_term, subject, marks_obtained, remarks) 
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            marks_obtained = VALUES(marks_obtained),
            remarks = VALUES(remarks)
        `, [student_id, exam_term, subject, marks_obtained, remarks || '']);

        res.status(200).json({ message: 'Exam result saved successfully' });
    } catch (err) {
        console.error('Error saving exam result:', err);
        res.status(500).json({ error: 'Database error saving exam result' });
    }
});

// 41. POST /fees/create-order - Create a Razorpay payment order (public)
app.post('/fees/create-order', async (req, res) => {
    try {
        const { account_id, amount } = req.body;
        if (!account_id || !amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ error: 'Account ID and a valid amount are required.' });
        }

        // Verify the account exists
        const [accounts] = await db.query('SELECT id, name FROM fee_accounts WHERE id = ?', [account_id]);
        if (accounts.length === 0) {
            return res.status(404).json({ error: 'Fee account not found.' });
        }

        // Razorpay amount is in PAISE (multiply by 100)
        const options = {
            amount: Math.round(parseFloat(amount) * 100),
            currency: 'INR',
            receipt: `fee_acct_${account_id}_${Date.now()}`,
            notes: {
                account_id: account_id,
                student_name: accounts[0].name
            }
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json({
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ error: 'Failed to create payment order.' });
    }
});

// 42. POST /fees/verify-payment - Verify payment and record in DB
app.post('/fees/verify-payment', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, account_id, amount, fee_month } = req.body;

        // Step 1: Verify the signature to ensure payment is genuine
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ error: 'Payment verification failed. Invalid signature.' });
        }

        // Step 2: Record the payment in fee_transactions
        await db.query(
            'INSERT INTO fee_transactions (account_id, amount, payment_method, remarks, fee_month) VALUES (?, ?, ?, ?, ?)',
            [account_id, amount, 'Online (Razorpay)', `Payment ID: ${razorpay_payment_id}`, fee_month || '']
        );

        // Step 3: Update the total amount_paid in fee_accounts
        await db.query(
            'UPDATE fee_accounts SET amount_paid = amount_paid + ? WHERE id = ?',
            [amount, account_id]
        );

        // Step 4: Send SMS confirmation with Name & Reg Number
        const [accounts] = await db.query('SELECT name, phone, reg_number FROM fee_accounts WHERE id = ?', [account_id]);
        if (accounts.length > 0 && accounts[0].phone) {
            const acc = accounts[0];
            const monthText = fee_month ? ` for ${fee_month}` : '';
            const regText = acc.reg_number ? ` | Reg No: ${acc.reg_number}` : '';

            const msg = `Dear ${acc.name}${regText}, your online fee payment of Rs.${amount}${monthText} has been received successfully. Payment ID: ${razorpay_payment_id}. Thank you! - Annai Therasa Hr Sec School`;

            console.log(`[SMS] Sending payment confirmation to ${acc.phone}: ${msg}`);

            if (process.env.MSG91_AUTH_KEY && process.env.MSG91_AUTH_KEY !== 'YourActualLongStringOfLettersAndNumbers') {
                smsService.sendSMS(acc.phone, msg).catch(err => console.log('SMS error (non-fatal):', err));
            } else {
                // Log simulated SMS when MSG91 is not configured
                console.log(`[SMS SIMULATED] To: ${acc.phone} | Message: ${msg}`);
            }
        }

        res.status(200).json({ message: 'Payment verified and recorded successfully!' });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: 'Server error during payment verification.' });
    }
});

// Staff Login Endpoint
const STAFF_CREDENTIALS = {
    username: 'teacher',
    password: 'staff@123'
};

app.post('/staff/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }
    if (username === STAFF_CREDENTIALS.username && password === STAFF_CREDENTIALS.password) {
        const token = jwt.sign({ role: 'staff', username }, auth.JWT_SECRET, { expiresIn: '8h' });
        return res.json({ token, message: 'Staff login successful' });
    }
    return res.status(401).json({ error: 'Invalid username or password.' });
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
