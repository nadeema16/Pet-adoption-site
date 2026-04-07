document.addEventListener('DOMContentLoaded', async () => {
    const petId = window.location.pathname.split('/').pop();
    const content = document.getElementById('applications-content');
    const errorMessage = document.getElementById('error-message');
    try {
        const response = await fetch(`/api/shelter/applications/${petId}`);
        if (!response.ok) {
            throw new Error('Failed to load applications');
        }
        const data = await response.json();
        const { pet, applications } = data;
        document.getElementById('pet-photo').src = pet.photo_url;
        document.getElementById('pet-name').textContent = pet.name;
        document.getElementById('pet-species').textContent = pet.species_breed;
        const count = applications.length;
        document.getElementById('applications-count').textContent = 
            `${count} application${count !== 1 ? 's' : ''} for this pet`;
        const appsList = document.getElementById('applications-list');
        const noApps = document.getElementById('no-apps');
        if (applications.length === 0) {
            appsList.style.display = 'none';
            noApps.style.display = 'block';
        } else {
            noApps.style.display = 'none';
            appsList.innerHTML = applications.map(app => {
                const statusClass = `status-${app.status}`;
                const statusText = app.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                let actionButtons = '';
                if (app.status === 'submitted') {
                    actionButtons = `
                        <button class="btn btn-secondary btn-small" onclick="updateApplicationStatus(${app.id}, 'under_review')">Mark Under Review</button>
                        <button class="btn btn-success btn-small" onclick="updateApplicationStatus(${app.id}, 'approved')">Approve</button>
                        <button class="btn btn-danger btn-small" onclick="updateApplicationStatus(${app.id}, 'declined')">Decline</button>
                    `;
                } else if (app.status === 'under_review') {
                    actionButtons = `
                        <button class="btn btn-success btn-small" onclick="updateApplicationStatus(${app.id}, 'approved')">Approve</button>
                        <button class="btn btn-danger btn-small" onclick="updateApplicationStatus(${app.id}, 'declined')">Decline</button>
                    `;
                } else {
                    actionButtons = '<span class="status-badge ' + statusClass + '">' + statusText + '</span>';
                }
                return `
                    <div class="application-detail-card">
                        <div class="application-detail-header">
                            <div class="application-detail-info">
                                <h3>${app.adopter_username}</h3>
                                <p class="application-detail-meta">Email: ${app.adopter_email}</p>
                                <p class="application-detail-meta">Application Date: ${app.formatted_date}</p>
                                <span class="status-badge ${statusClass}">${statusText}</span>
                            </div>
                        </div>
                        <div class="application-content">
                            <h4>Home Setup</h4>
                            <p>${app.home_setup}</p>
                            <h4>Prior Pets Experience</h4>
                            <p>${app.prior_pets}</p>
                        </div>
                        <div class="application-actions">
                            ${actionButtons}
                        </div>
                    </div>`;
            }).join('');
        }
        content.style.display = 'block';
    } catch (error) {
        console.error('Error loading applications:', error);
        errorMessage.textContent = error.message || 'Error loading applications. Please try again later.';
        errorMessage.style.display = 'block';
    }
});
async function updateApplicationStatus(applicationId, newStatus) {
    if (!confirm(`Are you sure you want to ${newStatus.replace('_', ' ')} this application?`)) {
        return;
    }
    try {
        const response = await fetch(`/api/application/${applicationId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        const data = await response.json();
        if (!response.ok) {
            alert(data.error || 'Failed to update application status');
            return;
        }
        window.location.reload();
    } catch (error) {
        console.error('Error updating application status:', error);
        alert('An error occurred. Please try again.');
    }
}