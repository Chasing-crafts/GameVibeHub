import { ref, push } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

export function initializeNewsletter(database) {
    const newsletterSubmit = document.getElementById('newsletter-submit');
    const newsletterEmail = document.getElementById('newsletter-email');
    const newsletterError = document.getElementById('newsletter-error');

    newsletterSubmit.addEventListener('click', async () => {
        const email = newsletterEmail.value.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newsletterError.textContent = 'Please enter a valid email address.';
            newsletterError.classList.remove('hidden');
            return;
        }
        try {
            await push(ref(database, 'newsletter'), {
                email,
                timestamp: Date.now()
            });
            newsletterEmail.value = '';
            newsletterError.textContent = 'Subscribed successfully!';
            newsletterError.classList.remove('hidden');
            newsletterError.classList.remove('error-message');
            setTimeout(() => {
                newsletterError.classList.add('hidden');
                newsletterError.classList.add('error-message');
            }, 3000);
        } catch (error) {
            console.error('Newsletter signup error:', error);
            newsletterError.textContent = `Signup error: ${error.message}`;
            newsletterError.classList.remove('hidden');
        }
    });
}