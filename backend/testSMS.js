require('dotenv').config();
const smsService = require('./services/smsService');

// ============================================
// MSG91 Test Script
// ============================================

// 1. Enter the phone number you want to send the test message to (with country code, but no +)
// Example: "919876543210"
const testPhone = "919876543210"; 

// 2. The message you want to send. 
// Note: This string will be mapped to 'VAR1' in your MSG91 Template. 
// Make sure your MSG91 template looks something like: "Your message is: {#VAR1#}"
const testMessage = "This is a test message from your app using MSG91!";

async function testMsg91() {
    console.log("Starting MSG91 test...");
    
    // Check if keys are properly configured
    if (!process.env.MSG91_AUTH_KEY || process.env.MSG91_AUTH_KEY === 'your_msg91_auth_key_here') {
        console.error("❌ ERROR: Please add your actual MSG91_AUTH_KEY to the .env file.");
        return;
    }
    
    if (!process.env.MSG91_TEMPLATE_ID || process.env.MSG91_TEMPLATE_ID === 'your_msg91_template_id_here') {
        console.error("❌ ERROR: Please add your actual MSG91_TEMPLATE_ID to the .env file.");
        return;
    }

    console.log(`Sending to phone: ${testPhone}`);
    
    // Call the existing smsService
    const success = await smsService.sendSMS(testPhone, testMessage);
    
    if (success) {
        console.log("✅ MSG91 request completed. Check the console output above to see if it was successful.");
    } else {
        console.log("❌ The MSG91 request failed. Please verify your auth key and internet connection.");
    }
}

testMsg91();
