import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getDatabase, ref, get, set } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';
import { addVibePoints } from './utils.js';

export function initializeAuth(app) {
    const auth = getAuth(app);
    const database = getDatabase(app);
    const authToggle = document.getElementById('auth-toggle');
    const authModal = document.getElementById('auth-modal');
    const authSignup = document.getElementById('auth-signup');
    const authLogin = document.getElementById('auth-login');
    const authClose = document.getElementById('auth-close');
    const authUsername = document.getElementById('auth-username');
    const authEmail = document.getElementById('auth-email');
    const authPassword = document.getElementById('auth-password');
    const authError = document.getElementById('auth-error');
    const userGreeting = document.getElementById('user-greeting');
    let currentUser = null;

    authToggle.addEventListener('click', () => {
        authModal.classList.toggle('open');
        authError.classList.add('hidden');
        authUsername.value = '';
        authEmail.value = '';
        authPassword.value = '';
        if (currentUser) {
            authToggle.textContent = 'Log Out';
            authToggle.classList.replace('bg-indigo-600', 'bg-red-600');
            authToggle.addEventListener('click', async () => {
                await signOut(auth);
                authToggle.textContent = 'Sign Up / Log In';
                authToggle.classList.replace('bg-red-600', 'bg-indigo-600');
                userGreeting.textContent = 'Welcome, Guest!';
                userGreeting.classList.add('hidden');
                currentUser = null;
            }, { once: true });
        }
    });

    authClose.addEventListener('click', () => {
        authModal.classList.remove('open');
        authError.classList.add('hidden');
    });

    authSignup.addEventListener('click', async () => {
        const username = authUsername.value.trim();
        const email = authEmail.value.trim();
        const password = authPassword.value.trim();
        if (!username || !email || !password) {
            authError.textContent = 'Please fill in all fields.';
            authError.classList.remove('hidden');
            return;
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await set(ref(database, `users/${userCredential.user.uid}`), {
                username,
                email,
                points: 100,
                timestamp: Date.now()
            });
            authModal.classList.remove('open');
            authError.classList.add('hidden');
            console.log(`User ${username} signed up`);
        } catch (error) {
            authError.textContent = `Signup error: ${error.message}`;
            authError.classList.remove('hidden');
            console.error('Signup error:', error);
        }
    });

    authLogin.addEventListener('click', async () => {
        const email = authEmail.value.trim();
        const password = authPassword.value.trim();
        if (!email || !password) {
            authError.textContent = 'Please enter email and password.';
            authError.classList.remove('hidden');
            return;
        }
        try {
            await signInWithEmailAndPassword(auth, email, password);
            authModal.classList.remove('open');
            authError.classList.add('hidden');
            console.log('User logged in');
        } catch (error) {
            authError.textContent = `Login error: ${error.message}`;
            authError.classList.remove('hidden');
            console.error('Login error:', error);
        }
    });

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const snapshot = await get(ref(database, `users/${user.uid}`));
            if (snapshot.exists()) {
                currentUser = snapshot.val();
                currentUser.uid = user.uid;
                userGreeting.textContent = `Welcome, ${currentUser.username}! (${currentUser.points} Vibe Points)`;
                userGreeting.classList.remove('hidden');
                authToggle.textContent = 'Log Out';
                authToggle.classList.replace('bg-indigo-600', 'bg-red-600');
                document.getElementById('username').value = currentUser.username;
                document.getElementById('win-username').value = currentUser.username;
            }
        } else {
            currentUser = null;
            userGreeting.textContent = 'Welcome, Guest!';
            userGreeting.classList.add('hidden');
            authToggle.textContent = 'Sign Up / Log In';
            authToggle.classList.replace('bg-red-600', 'bg-indigo-600');
        }
    });

    return auth;
}