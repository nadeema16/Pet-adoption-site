document.addEventListener('DOMContentLoaded', async () => {
    const petId = window.location.pathname.split('/').pop();
    const petDetails = document.getElementById('pet-details');
    const errorMessage = document.getElementById('error-message');
    try {
        const response = await fetch(`/api/pet/${petId}`);
        if (!response.ok) {
            throw new Error('Pet not found');
        }
        const pet = await response.json();
        document.getElementById('pet-photo').src = pet.photo_url;
        document.getElementById('pet-name').textContent = pet.name;
        document.getElementById('pet-species').textContent = pet.species_breed;
        document.getElementById('pet-age').textContent = pet.age;
        document.getElementById('pet-size').textContent = pet.size.charAt(0).toUpperCase() + pet.size.slice(1);
        document.getElementById('pet-date').textContent = pet.formatted_date;
        document.getElementById('pet-shelter').textContent = pet.shelter_username;
        document.getElementById('pet-description').innerHTML = pet.description_html;
        const temperamentContainer = document.getElementById('temperament-tags');
        temperamentContainer.innerHTML = pet.temperament_list.map(t => 
            `<span class="temperament-tag">${t}</span>`
        ).join('');
        const actionsContainer = document.getElementById('pet-actions');
        let actionsHTML = '';
        if (pet.is_owner) {
            actionsHTML = `
                <a href="/shelter/applications/${pet.id}" class="btn btn-primary">View Applications</a>
                <a href="/shelter/pets" class="btn btn-secondary">Back to My Pets</a>
            `;
        } else if (pet.can_apply) {
            actionsHTML = `
                <a href="/apply/${pet.id}" class="btn btn-primary">Apply to Adopt</a>
            `;
        }
        actionsContainer.innerHTML = actionsHTML;
        const shelterContact = document.getElementById('shelter-contact');
        if (pet.show_contact) {
            document.getElementById('shelter-email').textContent = pet.shelter_email;
            document.getElementById('shelter-phone').textContent = pet.shelter_phone || 'N/A';
            shelterContact.style.display = 'block';
        } else {
            shelterContact.style.display = 'none';
        }
        petDetails.style.display = 'block';
    } catch (error) {
        console.error('Error loading pet details:', error);
        errorMessage.textContent = 'Error loading pet details. Please try again later.';
        errorMessage.style.display = 'block';
    }
});