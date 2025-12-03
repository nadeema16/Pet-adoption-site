document.addEventListener('DOMContentLoaded', async()=>{
    const container = document.getElementById('pet-container');

    try{
        const response = await fetch('/api/pets');
        const pets = await response.json();
        if(pets.length === 0){
            container.innerHTML = '<div class="empty-state"><p>No Pets Available at the Moment.</p></div>';
            return;
        }
        container.innerHTML = pets.map(pet=>`
        <a href="/pet/${pet.id}" class="pet-card">
            <img src="${pet.photo_url}" alt="${pet.name} onerror="this.src='https://placedog.net/400/400'">
            <div class="pet-card-content">
                <h3>${pet.name}</h3>
                <div class="pet-card-meta">
                    <p> Listed: ${pet.formatted_date}</p>
                    <p> Listed: ${pet.shelter_username}</p>
                </div>
            </div>
        </a>`).join('');
    }catch(error){
        console.error('Error Loading Pets:', error);
        container.innerHTML='<div class="error-message">Error Loading Pets. Please try again later</div>';
    }
});