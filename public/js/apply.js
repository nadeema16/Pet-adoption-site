document.addEventListener('DOMContentLoaded', async () => {
    const petId = window.location.pathname.split('/').pop();
    const form = document.getElementById('application-form');
    const errorMessage = document.getElementById('error-message');
    const errorPage = document.getElementById('error-page');
    try {
        const response = await fetch(`/api/apply/${petId}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to load application form');
        }
        const data = await response.json();
        document.getElementById('pet-name').value = data.pet.name;
        document.getElementById('pet-name-header').textContent = `Applying to adopt ${data.pet.name}`;
        document.getElementById('your-name').value = data.user.name;
        document.getElementById('email').value = data.user.email;
        form.style.display = 'block';
    } catch (error) {
        console.error('Error loading application form:', error);
        errorPage.textContent = error.message || 'Error loading application form. Please try again.';
        errorPage.style.display = 'block';
    }
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();
        const formData = {
            phone: document.getElementById('phone').value.trim(),
            home_setup: document.getElementById('home-setup').value.trim(),
            prior_pets: document.getElementById('prior-pets').value.trim()
        };
        if (!formData.home_setup || !formData.prior_pets) {
            showError('Please fill in all required fields');
            return;
        }
        try {
            const response = await fetch(`/api/apply/${petId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (!response.ok) {
                showError(data.error || 'Failed to submit application');
                return;
            }
            window.location.href = data.redirect || '/adopter/dashboard';
        } catch (error) {
            console.error('Application submission error:', error);
            showError('An error occurred. Please try again.');
        }
    });
});
