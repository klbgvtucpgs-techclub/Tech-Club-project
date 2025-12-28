


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

const inputs = {
    name: document.getElementById('name'),
    employee_id: document.getElementById('employee_id'),
    email: document.getElementById('email'),
    phone: document.getElementById('phone')
};

const patterns = {
    name: /^[a-zA-Z\s]{3,100}$/,
    employee_id: /^[A-Za-z0-9-]+$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\d\s\-\+\(\)]{10,}$/
};

const errorMessages = {
    name: 'Please enter a valid name (letters and spaces only)',
    employee_id: 'Only alphanumeric characters and hyphens allowed',
    email: 'Please enter a valid email address',
    phone: 'Please enter a valid phone number'
};

// Add event listeners to inputs
Object.keys(inputs).forEach(key => {
    const input = inputs[key];
    const errorSpan = document.getElementById(`${key}-error`);
    const icon = input.nextElementSibling;

    input.addEventListener('input', () => {
        validateField(input, errorSpan, icon, key);
    });

    input.addEventListener('blur', () => {
        validateField(input, errorSpan, icon, key);
    });
});

function validateField(input, errorSpan, icon, fieldName) {
    const value = input.value.trim();

    if (fieldName === 'phone' && !value) {
        input.classList.remove('invalid', 'valid');
        icon.classList.remove('show', 'success', 'error');
        errorSpan.textContent = '';
        return true;
    }

    if (input.hasAttribute('required') && !value) {
        input.classList.add('invalid');
        input.classList.remove('valid');
        icon.classList.add('show', 'error');
        icon.classList.remove('success');
        errorSpan.textContent = 'This field is required';
        return false;
    }

    if (value && patterns[fieldName] && !patterns[fieldName].test(value)) {
        input.classList.add('invalid');
        input.classList.remove('valid');
        icon.classList.add('show', 'error');
        icon.classList.remove('success');
        errorSpan.textContent = errorMessages[fieldName];
        return false;
    }

    if (value) {
        input.classList.remove('invalid');
        input.classList.add('valid');
        icon.classList.add('show', 'success');
        icon.classList.remove('error');
        errorSpan.textContent = '';
        return true;
    }

    return true;
}

function validateForm() {
    let isValid = true;

    Object.keys(inputs).forEach(key => {
        const input = inputs[key];
        const errorSpan = document.getElementById(`${key}-error`);
        const icon = input.nextElementSibling;

        if (!validateField(input, errorSpan, icon, key)) {
            isValid = false;
        }
    });

    return isValid;
}

function showMessage(text, type) {
    messageText.textContent = text;
    message.className = `message ${type}`;
    message.classList.add('show');

    setTimeout(() => {
        message.classList.remove('show');
    }, 5000);
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) {
        showMessage('Please fix the errors above before submitting', 'error');
        return;
    }

    generateBtn.classList.add('loading');
    generateBtn.disabled = true;
    message.classList.remove('show');

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    Object.keys(data).forEach(key => {
        data[key] = data[key].trim();
    });

    // Simulate API call (replace with actual endpoint)
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulated success response
        showMessage(
            `Success! Password generated and sent to ${data.email}`,
            'success'
        );

        form.reset();
        Object.values(inputs).forEach(input => {
            input.classList.remove('valid', 'invalid');
            input.nextElementSibling.classList.remove('show', 'success', 'error');
        });

        document.querySelectorAll('.error-text').forEach(span => {
            span.textContent = '';
        });

    } catch (error) {
        showMessage(
            'Network Error: Could not connect to the server. Please try again.',
            'error'
        );
    } finally {
        generateBtn.classList.remove('loading');
        generateBtn.disabled = false;
    }
});

