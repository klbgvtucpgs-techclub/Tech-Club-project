document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('password-form');
    const message = document.getElementById('message');
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

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const headers = {
                'Content-Type': 'application/json'
            };

            // Add auth if available
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/generate-password', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                message.textContent = result.message || `Success! Password generated and sent to ${data.email}.`;
                message.classList.add('success');
                form.reset();

            } else {
                message.textContent = `Error: ${result.detail || 'Failed to generate password.'}`;
                message.classList.add('error');
            }

        } catch (error) {
            message.textContent = `Network Error: Could not connect to the server.`;
            message.classList.add('error');
            console.error('Submission error:', error);

        } finally {
            generateBtn.textContent = 'Generate & Send Password';
            generateBtn.disabled = false;
        }
    });
});