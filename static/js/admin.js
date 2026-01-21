


// Create floating particles
const particlesContainer = document.getElementById('particles');
for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 15 + 's';
    particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
    particlesContainer.appendChild(particle);
}

// Form handling
const form = document.getElementById('password-form');
const message = document.getElementById('message');
const messageText = message.querySelector('.message-text');
const generateBtn = document.getElementById('generate-btn');

// Check if admin is logged in
const token = localStorage.getItem('access_token');
const userType = localStorage.getItem('user_type');

if (!token || userType !== 'admin') {
    // Not logged in as admin, but allow form to work
    console.log('Note: Running without admin authentication');
}

form.addEventListener('submit', async function (event) {
    event.preventDefault();

    message.textContent = '';
    message.className = 'message';

    generateBtn.textContent = 'Processing...';
    generateBtn.disabled = true;

    // Collect all form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // --- BACKEND COMMUNICATION ---
    // **This URL must be the endpoint created on your server (e.g., Flask, Node.js)**
    const API_URL = '/api/generate-password';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            // Important: Set the header for JSON data
            headers: {
                'Content-Type': 'application/json'
            },
            // Convert JavaScript object to JSON string
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();

            // Display Success Message
            message.textContent = `Success! Password generated and sent to ${data.email}.`;
            message.classList.add('success');
            form.reset(); // Clear the form on successful submission

        } else {
            const error = await response.json();

            // Display Error Message
            message.textContent = `Error: ${error.message || 'Failed to generate password. Check server logs.'}`;
            message.classList.add('error');
        }

    } catch (error) {
        // Handle network errors (e.g., server is down)
        message.textContent = `Network Error: Could not connect to the server.`;
        message.classList.add('error');
        console.error('Submission error:', error);

    } finally {
        // Re-enable the button regardless of success or failure
        generateBtn.textContent = 'Generate & Send Password';
        generateBtn.disabled = false;
    }
});
});