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

    function redirectToDashboard(userType) {
        if (userType === 'admin') {
            window.location.href = '/templates/admin_dashboard.html';
        } else {
            window.location.href = '/templates/faculty_dashboard.html';
        }
    }

    function showMessage(text, type) {
        const existingMsg = document.querySelector('.login-message');
        if (existingMsg) existingMsg.remove();

        const msg = document.createElement('p');
        msg.className = `login-message message ${type}`;
        msg.textContent = text;
        msg.style.marginTop = '15px';
        msg.style.padding = '10px';
        msg.style.borderRadius = '5px';
        msg.style.textAlign = 'center';

        if (type === 'success') {
            msg.style.backgroundColor = '#d4edda';
            msg.style.color = '#155724';
        } else {
            msg.style.backgroundColor = '#f8d7da';
            msg.style.color = '#721c24';
        }

        form.appendChild(msg);
    }
});

// Utility function for other pages to check auth
function checkAuth(requiredType = null) {
    const token = localStorage.getItem('access_token');
    const userType = localStorage.getItem('user_type');

    if (!token) {
        window.location.href = '/templates/login.html';
        return false;
    }

    if (requiredType && userType !== requiredType) {
        window.location.href = '/templates/login.html';
        return false;
    }

    return true;
}

// Logout function
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_type');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    window.location.href = '/templates/login.html';
}

// Get auth headers for API calls
function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}