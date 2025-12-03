async function checkAuth(){
    try{
        const response = await fetch('/api/user/check');
        const data = await response.json();
        if(data.loggedIn){
            const authLinks = document.getElementById('auth-links');
            const userLinks = document.getElementById('user-links');
            const usernameDisplay = document.getElementById('username-display');
            const dashboardLink = document.getElementById('dash-links');
            if (authLinks) authLinks.style.display = 'none';
            if (userLinks) userLinks.style.display = 'inline-flex';
            if (usernameDisplay) usernameDisplay.textContent = data.username;
            if (dashboardLink){
                dashboardLink.href = data.userType === 'shelter' ? '/shelter/dashboad' : '/adopter/dashboad';
                dashboardLink.textContent = data.userType === 'shelter' ? 'Dashboad' : 'My Applications';
            }
        }
    } catch(error){
        console.error('Error Checking Auth:', error);
    }
}

function setupLogout(){
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn){
        logoutBtn.addEventListener('click', async(e)=> {
            e.preventDefault();
            try{
                const response = await fetch('/logout',{method: 'POST'});
                const data = await response.json();
                window.location.href = data.redirect || '/';
            } catch (error){
                window.location.href = '/logout';
            }
        });
    }
}
function formatData(dataString){
    const date = new Date(dataString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getData()}, ${date.getFullYear()}`;
}

function showError(message, ContainerId = 'error-message'){
    const errorDiv = document.getElementById(ContainerId);
    if(errorDiv){
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(()=>{
            errorDiv.scrollIntoView({behavior: 'smooth', block: 'nearest'});
        }, 100);
    }
}
function hideError(ContainerId = 'error-message'){
    const errorDiv = document.getElementById(ContainerId);
    if(errorDiv){
        errorDiv.style.display = 'none';
    }
}
function getUrlParameter(name){
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}
document.addEventListener('DOMContentLoaded', ()=> {
    checkAuth();
    setupLogout();
});