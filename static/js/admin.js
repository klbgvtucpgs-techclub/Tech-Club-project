document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('password-form');
    const message = document.getElementById('message');
    const generateBtn = document.getElementById('generate-btn');

    form.addEventListener('submit', async function(event) {
        // Prevent the default form submission (page reload)
        event.preventDefault();

        // Clear previous messages
        message.textContent = '';
        message.className = 'message';
        
        // Disable button and show loading state
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