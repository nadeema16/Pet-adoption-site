async function checkAuth() {
    try {
        const response = await fetch('/api/user/check');
        const data = await response.json();
        
        if (data.loggedIn) {
            const authLinks = document.getElementById('auth-links');
            const userLinks = document.getElementById('user-links');
            const usernameDisplay = document.getElementById('username-display');
            const dashboardLink = document.getElementById('dashboard-link');
            
            if (authLinks) authLinks.style.display = 'none';
            if (userLinks) userLinks.style.display = 'inline-flex';
            if (usernameDisplay) usernameDisplay.textContent = data.username;
            if (dashboardLink) {
                dashboardLink.href = data.userType === 'shelter' ? '/shelter/dashboard' : '/adopter/dashboard';
                dashboardLink.textContent = data.userType === 'shelter' ? 'Dashboard' : 'My Applications';
            }
        }
    } catch (error) {
        console.error('Error checking auth:', error);
    }
}
function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const response = await fetch('/logout', { method: 'POST' });
                const data = await response.json();
                window.location.href = data.redirect || '/';
            } catch (error) {
                window.location.href = '/logout';
            }
        });
    }
}
function formatDate(dateString) {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
function showError(message, containerId = 'error-message') {
    const errorDiv = document.getElementById(containerId);
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
}
function hideError(containerId = 'error-message') {
    const errorDiv = document.getElementById(containerId);
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}
function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupLogout();
});