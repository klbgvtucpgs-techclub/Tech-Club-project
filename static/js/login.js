document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const message = document.getElementById('message');
    const loginBtn = document.getElementById('login-btn');

    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        message.textContent = '';
        message.className = 'message';
        loginBtn.textContent = 'Logging In...';
        loginBtn.disabled = true;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // --- BACKEND LOGIN ENDPOINT ---
        const API_URL = '/api/login'; 

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                // Successful login - The backend sets a secure cookie/session here
                message.textContent = 'Login successful! Redirecting...';
                message.classList.add('success');
                // Redirect user to the protected admin page
                setTimeout(() => { window.location.href = 'admin.html'; }, 1000); 

            } else {
                const error = await response.json();
                message.textContent = `Login failed: ${error.message || 'Invalid email or password.'}`;
                message.classList.add('error');
            }

        } catch (error) {
            message.textContent = 'Network Error: Could not reach the server.';
            message.classList.add('error');
            console.error('Login error:', error);
            
        } finally {
            loginBtn.textContent = 'Log In';
            loginBtn.disabled = false;
        }
    });
});
form.addEventListener('submit', async function(event) {
    event.preventDefault();
    message.textContent = '';
    message.className = 'message';

    loginBtn.textContent = 'Logging In...';
    loginBtn.classList.add('loading');
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
            message.textContent = 'Login successful! Redirecting...';
            message.classList.add('success');

            document.querySelector('.container')
                .classList.add('success-redirect');

            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 900);

        } else {
            const error = await response.json();
            message.textContent = `Login failed: ${error.message || 'Invalid credentials'}`;
            message.classList.add('error', 'shake');
        }

    } catch (err) {
        message.textContent = 'Network Error';
        message.classList.add('error', 'shake');
    } finally {
        loginBtn.textContent = 'Sign-in';
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
    }
});

