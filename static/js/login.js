document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');

    // Only run login form logic if we're on the login page
    if (!form) return;

    const loginBtn = document.getElementById('login-btn');

    // Check if already logged in
    const token = localStorage.getItem('access_token');
    if (token) {
        const userType = localStorage.getItem('user_type');
        redirectToDashboard(userType);
        return;
    }

    form.addEventListener('submit', async function (event) {
        event.preventDefault();
        const existingMsg = document.querySelector('.login-message');
        if (existingMsg) existingMsg.remove();

        loginBtn.textContent = 'Logging In...';
        loginBtn.disabled = true;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();

                // Store token and user info
                localStorage.setItem('access_token', result.access_token);
                localStorage.setItem('user_type', result.user_type);
                localStorage.setItem('user_id', result.user_id);
                localStorage.setItem('user_name', result.name);

                showMessage('Login successful! Redirecting...', 'success');

                // Redirect based on user type
                setTimeout(() => {
                    redirectToDashboard(result.user_type);
                }, 1000);

            } else {
                const error = await response.json();
                showMessage(error.detail || 'Invalid email or password', 'error');
            }

        } catch (error) {
            showMessage('Network Error: Could not reach the server.', 'error');
            console.error('Login error:', error);

        } finally {
            loginBtn.textContent = 'Sign-in';
            loginBtn.disabled = false;
        }
    });
});