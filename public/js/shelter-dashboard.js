document.addEventListener('DOMContentLoaded', async () => {
    const content = document.getElementById('dashboard-content');
    try {
        const response = await fetch('/api/shelter/dashboard');
        const data = await response.json();
        document.getElementById('shelter-name').textContent = data.username;
        document.getElementById('total-pets').textContent = data.statistics.total_pets || 0;
        document.getElementById('active-pets').textContent = data.statistics.active_pets || 0;
        document.getElementById('adopted-pets').textContent = data.statistics.adopted_pets || 0;
        document.getElementById('pending-apps').textContent = data.statistics.pending_applications || 0;
        const recentList = document.getElementById('recent-applications-list');
        const noRecentApps = document.getElementById('no-recent-apps');
        if (data.recent_applications && data.recent_applications.length > 0) {
            recentList.innerHTML = data.recent_applications.map(app => {
                const statusClass = `status-${app.status}`;
                const statusText = app.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                return `
                    <div class="application-card">
                        <div class="application-header">
                            <img src="${app.photo_url}" alt="${app.pet_name}" onerror="this.src='https://placedog.net/100/100'">
                            <div class="application-info">
                                <h3><a href="/shelter/applications/${app.pet_id}">${app.pet_name}</a></h3>
                                <p class="application-meta">From: ${app.adopter_username}</p>
                                <p class="application-meta">Date: ${app.formatted_date}</p>
                                <span class="status-badge ${statusClass}">${statusText}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            noRecentApps.style.display = 'none';
        } else {
            recentList.innerHTML = '';
            noRecentApps.style.display = 'block';
        }
        content.style.display = 'block';
    } catch (error) {
        console.error('Error loading dashboard:', error);
        content.innerHTML = '<div class="error-message">Error loading dashboard. Please try again later.</div>';
    }
});