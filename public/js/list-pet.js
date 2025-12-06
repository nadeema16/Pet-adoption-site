document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('list-pet-form');
    const errorMessage = document.getElementById('error-message');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();
        const formData = new FormData();
        formData.append('name', document.getElementById('name').value.trim());
        formData.append('species_breed', document.getElementById('species-breed').value.trim());
        formData.append('age', document.getElementById('age').value.trim());
        formData.append('size', document.getElementById('size').value);
        formData.append('description', document.getElementById('description').value.trim());
        const temperamentCheckboxes = document.querySelectorAll('input[name="temperament"]:checked');
        if (temperamentCheckboxes.length === 0) {
            showError('Please select at least one temperament');
            return;
        }
        const temperament = Array.from(temperamentCheckboxes).map(cb => cb.value).join(', ');
        formData.append('temperament', temperament);
        const photoFile = document.getElementById('photo').files[0];
        if (photoFile) {
            formData.append('photo', photoFile);
        }
        if (!formData.get('name') || !formData.get('species_breed') || !formData.get('age') || 
            !formData.get('size') || !formData.get('description')) {
            showError('Please fill in all required fields');
            return;
        }
        try {
            const response = await fetch('/api/pets', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (!response.ok) {
                showError(data.error || 'Failed to create pet listing');
                return;
            }
            window.location.href = data.redirect || '/shelter/pets';
        } catch (error) {
            console.error('Error creating pet listing:', error);
            showError('An error occurred. Please try again.');
        }
    });
});