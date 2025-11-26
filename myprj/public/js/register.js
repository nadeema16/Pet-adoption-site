document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    const errorMessage = document.getElementById('error-message');
    const phoneField = document.getElementById('phone');
    const userTypeRadios = document.querySelectorAll('input[name="userType"]');
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
            confirm: document.getElementById('cpassword').value,
            userType: document.getElementById('user-type').value
        };
        if(!formData.username || !formData.email || !formData.password || !formData.confirm)
        {
            showError()
        }
    })
})