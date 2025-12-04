document.addEventListener('DOMContentLoaded', async ()=>{
    const container = document.getElementById('applications-container');
    const eState = document.getElementById('empty-state');
    try{
        const response = await fetch('/api/adopter/applications');
        const applications = await response.json();
        if(applications.length === 0){
            eState.style.display = 'block';
            return;
        }
        container.style.display = 'grid';
        container.innerHTML= applications.map(app=>{
            const statusClass = `status-${app.status}`;
            const statusText = app.status.replace('_', ' ').replace(/\b\w/g, l=> l.toUpperCase());
            return `
            <div class="application-card">
                <div class="application-header">
                    <img src="${app.photo_url}" alt="${app.pet_name}" onerror="this.src='https:placedog.net/200/200'">
                    <div class="application-info">
                        <h3><a href="/pet/${app.pet_id}">${app.pet_name}</a></h3>
                        <p class="application-meta"> Applied: ${app.formatted_date}</p>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                </div>
                ${app.show_contact ? `
                    <div style="margin-top:1rem; padding-top: 1rem; border-top: 1px solid #ddd}">
                        <p><strong>Shelter Cnntact:</strong></p>
                        <p>Email: ${app.shelter_email}</p>
                        <p>Email: ${app.shelter_phone || 'N/A'}</p>
                    </div>
                `: ''}
            </div>`;
        }).join('');
    }catch(error){
        console.error('Error Loading Aplications:', error);
    }
});