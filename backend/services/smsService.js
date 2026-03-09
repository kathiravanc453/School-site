// A dedicated service for handling SMS Notifications using MSG91
require('dotenv').config();
const axios = require('axios');

const authKey = process.env.MSG91_AUTH_KEY;
const templateId = process.env.MSG91_TEMPLATE_ID;

/**
 * Sends a real SMS using MSG91, with fallback if not configured.
 */
const sendSMS = async (phone, message) => {
    return new Promise(async (resolve) => {
        if (!authKey || !templateId || authKey === 'your_msg91_auth_key_here') {
            // Fallback simulated SMS
            setTimeout(() => {
                console.log(`[SIMULATED MSG91] -> SMS Sent to ${phone}: "${message}"`);
                resolve(true);
            }, 100);
            return;
        }

        try {
            // formatting phone
            // MSG91 expects mobile number usually with country code without +
            let formattedPhone = phone;
            if (formattedPhone.startsWith('+')) {
                formattedPhone = formattedPhone.slice(1);
            } else if (formattedPhone.length === 10) {
                // Default to India
                formattedPhone = '91' + formattedPhone;
            }

            const payload = {
                template_id: templateId,
                short_url: "0",
                recipients: [
                    {
                        mobiles: formattedPhone,
                        var: message, // Used in your new templates (##var##)
                        VAR1: message // Kept just in case you use VAR1 later
                    }
                ]
            };

            const response = await axios.post('https://control.msg91.com/api/v5/flow/', payload, {
                headers: {
                    'authkey': authKey,
                    'content-type': 'application/JSON'
                }
            });

            console.log(`[MSG91] -> Real SMS Sent to ${phone} (Response: ${JSON.stringify(response.data)})`);
            resolve(true);
        } catch (error) {
            console.error(`[MSG91 ERROR] -> Failed sending to ${phone}:`, error.message);
            resolve(false); // Resolve instead of reject so the loop doesn't break
        }
    });
};

/**
 * Broadcasts a text message to an array of student records.
 */
const broadcastAnnouncementSMS = async (db, text) => {
    try {
        // Fetch all students who have a phone number registered
        const [students] = await db.query('SELECT phone, name FROM students WHERE phone IS NOT NULL AND phone != ""');

        console.log(`\n===========================================`);
        console.log(`[SMS SYSTEM MSG91] Broadcasting Global Announcement`);
        console.log(`Message: "${text}"`);
        console.log(`Recipients: ${students.length} registered students`);
        console.log(`===========================================`);

        // Loop through all students and dispatch SMS
        for (const student of students) {
            await sendSMS(student.phone, text);
        }

        console.log(`===========================================\n`);
    } catch (smsError) {
        console.error('Error fetching student numbers for SMS:', smsError);
    }
};

module.exports = {
    sendSMS,
    broadcastAnnouncementSMS
};
