const db = require('./db.js');
async function run() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS staff_attendance (
                id INT AUTO_INCREMENT PRIMARY KEY,
                teacher_id INT NOT NULL,
                date DATE NOT NULL,
                status ENUM('Present', 'Absent', 'Leave', 'Half-day') NOT NULL DEFAULT 'Present',
                remarks VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_attendance (teacher_id, date),
                FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
            )
        `);
        console.log('Table staff_attendance created/verified successfully.');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
