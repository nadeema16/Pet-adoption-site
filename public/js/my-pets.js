document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('pets-container');
    const emptyState = document.getElementById('empty-state');
    try {
        const response = await fetch('/api/shelter/pets');
        const pets = await response.json();
        if (pets.length === 0) {
            emptyState.style.display = 'block';
            return;
        }
        container.style.display = 'grid';
        container.innerHTML = pets.map(pet => {
            const statusClass = pet.status === 'active' ? 'active' : 'inactive';
            const statusText = pet.status === 'active' ? 'Active' : 'Adopted';
            return `
                <div class="pet-management-card">
                    <img src="${pet.photo_url}" alt="${pet.name}" onerror="this.src='https://placedog.net/120/120'">
                    <div class="pet-management-info">
                        <h3><a href="/pet/${pet.id}">${pet.name}</a></h3>
                        <p class="pet-management-meta">${pet.species_breed}</p>
                        <p class="pet-management-meta">Listed: ${pet.formatted_date}</p>
                        <p class="pet-management-meta">
                            Status: <button class="status-toggle ${statusClass}" data-pet-id="${pet.id}" data-current-status="${pet.status}">
                                ${statusText}
                            </button>
                        </p>
                    </div>
                    <div class="pet-management-actions">
                        <a href="/shelter/applications/${pet.id}" class="btn btn-primary btn-small">
                            View Applications
                            ${pet.pending_count > 0 ? `<span class="pending-badge">${pet.pending_count}</span>` : ''}
                        </a>
                        <a href="/pet/${pet.id}" class="btn btn-secondary btn-small">View Pet</a>
                    </div>
                </div>
            `;
        }).join('');
        document.querySelectorAll('.status-toggle').forEach(toggle => {
            toggle.addEventListener('click', async (e) => {
                e.preventDefault();
                const petId = toggle.dataset.petId;
                const currentStatus = toggle.dataset.currentStatus;
                const newStatus = currentStatus === 'active' ? 'adopted' : 'active';
                if (confirm(`Are you sure you want to mark this pet as ${newStatus}?`)) {
                    try {
                        const response = await fetch(`/api/pet/${petId}/status`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ status: newStatus })
                        });
                        const data = await response.json();
                        if (!response.ok) {
                            alert(data.error || 'Failed to update status');
                            return;
                        }
                        window.location.reload();
                    } catch (error) {
                        console.error('Error updating status:', error);
                        alert('An error occurred. Please try again.');
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error loading pets:', error);
        container.innerHTML = '<div class="error-message">Error loading pets. Please try again later.</div>';
    }
});