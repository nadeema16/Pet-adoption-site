document.addEventListener('DOMContentLoaded', ()=>{
    const form = document.getElementById('login-form');
    const eMsg = document.getElementById('error-message');

    const urlE = getUrlParameter('error');
    if(urlE){
        showError(urlE);
    }
    form.addEventListener('submit', async(e) => {
        e.preventDefault();
        hideError();
        const formData={
            username: document.getElementById('username').value.trim(),
            password: document.getElementById('password').value
        };
        if(!formData.username || !formData.password){
            showError('Please Fill in All the Fields');
            return;
        }
        try{
            const response=await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if(!response.ok){
                showError(data.error || 'Login failed');
                return;
            }
            window.location.href = data.redirect || '/';
        } catch(error){
            console.error('Login error:', error);
            showError('An Error Occured, try Again');
        }
    });
});