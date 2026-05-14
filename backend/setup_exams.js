const pool = require('./db');

async function createTables() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS exam_results (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                exam_term VARCHAR(50) NOT NULL,
                subject VARCHAR(100) NOT NULL,
                marks_obtained DECIMAL(5,2) NOT NULL,
                total_marks DECIMAL(5,2) DEFAULT 100,
                remarks VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY(student_id, exam_term, subject)
            )
        `);
        console.log('Successfully created exam_results table');
        process.exit(0);
    } catch(err) {
        console.error('Failed', err);
        process.exit(1);
    }
}
createTables();
