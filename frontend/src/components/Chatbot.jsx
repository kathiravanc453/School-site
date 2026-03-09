import React, { useState, useEffect, useRef } from 'react';
import './Chatbot.css';

const ruleBasedResponses = {
    greetings: ["hello", "hi", "hey", "good morning", "good afternoon"],
    admissions: ["admission", "apply", "enroll", "join", "process"],
    fees: ["fee", "cost", "price", "amount", "payment"],
    timing: ["time", "hour", "open", "close", "when"],
    contact: ["contact", "phone", "email", "number", "call"]
};

const getResponse = (input) => {
    const lowerInput = input.toLowerCase();

    if (ruleBasedResponses.greetings.some(word => lowerInput.includes(word))) {
        return "Hello there! 👋 I'm the EduConnect virtual assistant. How can I help you today?";
    }
    if (ruleBasedResponses.admissions.some(word => lowerInput.includes(word))) {
        return "Admissions for the upcoming academic year are currently OPEN! You can fill out the application form by clicking the 'Admissions' button in the top menu.";
    }
    if (ruleBasedResponses.fees.some(word => lowerInput.includes(word))) {
        return "Our fee structure varies by grade level. Generally, it ranges from ₹40,000 to ₹75,000 per year. Please contact the front office for an exact breakdown.";
    }
    if (ruleBasedResponses.timing.some(word => lowerInput.includes(word))) {
        return "School timing is from 8:30 AM to 3:30 PM, Monday through Friday. The administrative office is open until 5:00 PM.";
    }
    if (ruleBasedResponses.contact.some(word => lowerInput.includes(word))) {
        return "You can reach our main office at +91 9876543210 or email us at info@educonnect.com.";
    }
    
    return "I'm not quite sure about that! I can help you with admissions, fees, timings, and contact info. For specific queries, please call our office.";
};

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Hi! 👋 Welcome to EduConnect. I'm your digital assistant. Ask me anything about admissions, fees, or school timings!", sender: 'bot' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMsg = { text: inputValue, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');

        // Simulate thinking delay
        setTimeout(() => {
            const botReply = { text: getResponse(userMsg.text), sender: 'bot' };
            setMessages(prev => [...prev, botReply]);
        }, 600);
    };

    return (
        <div className="chatbot-wrapper">
            {/* Chatbot Toggle Button */}
            <button 
                className={`chatbot-toggle ${isOpen ? 'open' : ''}`} 
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? '✕' : '💬'}
            </button>

            {/* Chatbot Window */}
            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <div className="chatbot-header-info">
                            <span className="bot-avatar">🤖</span>
                            <div>
                                <h4>EduBot Assistant</h4>
                                <span className="online-status">● Online</span>
                            </div>
                        </div>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message-bubble ${msg.sender}`}>
                                {msg.text}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chatbot-input-form" onSubmit={handleSendMessage}>
                        <input 
                            type="text" 
                            placeholder="Type your question..." 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                        <button type="submit" disabled={!inputValue.trim()}>➤</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Chatbot;
