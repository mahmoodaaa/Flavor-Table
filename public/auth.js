// auth.js
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please login to access this page');
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Add event listener for navigation links
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-btn');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href !== 'login.html' && !checkAuth()) {
                e.preventDefault();
            }
        });
    });
});
