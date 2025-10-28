// Sign-in form handler
document.getElementById('signinForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;

    // TODO: Add actual authentication logic here
    // For now, just redirect to the home page
    console.log('Sign in attempt:', { email, remember });

    // Simulate authentication delay
    const button = document.querySelector('.signin-button');
    button.textContent = 'Signing in...';
    button.disabled = true;

    setTimeout(() => {
        // Redirect to home page
        window.location.href = 'index.html';
    }, 1000);
});

// SSO button handler
document.querySelector('.sso-button').addEventListener('click', function() {
    // TODO: Add SSO authentication logic here
    console.log('SSO sign in clicked');
    alert('SSO authentication would be configured here');
});
