/**
 * Register Page JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    const errorMessage = document.getElementById('error-message');
    const phoneField = document.getElementById('phone');
    const userTypeRadios = document.querySelectorAll('input[name="userType"]');
    
    // Make phone required for shelters
    userTypeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === 'shelter') {
                phoneField.required = true;
            } else {
                phoneField.required = false;
            }
        });
    });
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();
        
        const formData = {
            username: document.getElementById('username').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('confirmPassword').value,
            userType: document.querySelector('input[name="userType"]:checked').value
        };
        
        // Validation
        if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
            showError('Please fill in all required fields');
            return;
        }
        
        if (formData.userType === 'shelter' && !formData.phone) {
            showError('Phone number is required for shelters');
            return;
        }
        
        if (formData.password.length < 6) {
            showError('Password must be at least 6 characters long');
            return;
        }
        
        if (formData.password !== formData.confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        
        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                showError(data.error || 'Registration failed');
                return;
            }
            
            // Redirect to dashboard or homepage
            window.location.href = data.redirect || '/';
            
        } catch (error) {
            console.error('Registration error:', error);
            showError('An error occurred. Please try again.');
        }
    });
});

