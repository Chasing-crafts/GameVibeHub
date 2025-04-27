import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';
import { initializeAuth } from './auth.js';
import { initializeChat } from './chat.js';
import { initializeMemes } from './memes.js';
import { initializePolls } from './polls.js';
import { initializeLeaderboard } from './leaderboard.js';
import { initializeGallery } from './gallery.js';
import { initializeQuotes } from './quotes.js';
import { initializeWins } from './wins.js';
import { initializeNewsletter } from './newsletter.js';
import { initializeDiscord } from './discord.js';
import { addVibePoints } from './utils.js';

const firebaseConfig = {
    apiKey: "AIzaSyB0QZQgiVJMmu0Dx91q5uYPsEEpWSDytoA",
    authDomain: "gamevibehub-ba607.firebaseapp.com",
    databaseURL: "https://gamevibehub-ba607-default-rtdb.firebaseio.com",
    projectId: "gamevibehub-ba607",
    storageBucket: "gamevibehub-ba607.firebasestorage.app",
    messagingSenderId: "743860292247",
    appId: "1:743860292247:web:63ca1a68cc6b480354b7d2"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = initializeAuth(app);
let OPENAI_API_KEY = '';

async function loadApiKey() {
    const chatError = document.getElementById('chat-error');
    const memeError = document.getElementById('meme-error');
    try {
        const snapshot = await get(ref(database, 'secrets/openai_api_key'));
        if (snapshot.exists()) {
            OPENAI_API_KEY = snapshot.val();
            console.log('OpenAI API key loaded successfully');
        } else {
            const errorMsg = 'OpenAI API key not found in Firebase.';
            console.error(errorMsg);
            chatError.textContent = errorMsg;
            memeError.textContent = errorMsg;
            chatError.classList.remove('hidden');
            memeError.classList.remove('hidden');
        }
    } catch (error) {
        const errorMsg = `Error fetching API key: ${error.message}`;
        console.error(errorMsg);
        chatError.textContent = errorMsg;
        memeError.textContent = errorMsg;
        chatError.classList.remove('hidden');
        memeError.classList.remove('hidden');
    }
}

function initializeAppFeatures() {
    particlesJS('particles-js', {
        particles: {
            number: { value: 100, density: { enable: true, value_area: 800 } },
            color: { value: '#ffd700' },
            shape: { type: 'circle' },
            opacity: { value: 0.6, random: true },
            size: { value: 4, random: true },
            line_linked: { enable: true, distance: 150, color: '#ffd700', opacity: 0.5, width: 1 },
            move: { enable: true, speed: 8, direction: 'none', random: true, straight: false, out_mode: 'out', bounce: false }
        },
        interactivity: {
            detect_on: 'canvas',
            events: { onhover: { enable: true, mode: 'repulse' }, onclick: { enable: true, mode: 'push' }, resize: true },
            modes: { repulse: { distance: 120, duration: 0.4 }, push: { particles_nb: 4 } }
        },
        retina_detect: true
    });

    const cursor = document.getElementById('custom-cursor');
    const sprite = document.getElementById('sprite');
    const spriteImg = document.getElementById('sprite-img');
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
        const trail = document.createElement('div');
        trail.className = 'cursor-trail';
        trail.style.left = `${e.clientX - 4}px`;
        trail.style.top = `${e.clientY - 4}px`;
        document.body.appendChild(trail);
        setTimeout(() => trail.remove(), 500);
    });

    const spriteImages = [
        '../assets/images/sprite1.jpg',
        '../assets/images/sprite2.jpg',
        '../assets/images/sprite3.jpg'
    ];
    const fallbackImage = 'https://placehold.co/50/ffd700/ffffff?text=Sprite';
    let spriteIndex = 0;
    function cycleSprite() {
        spriteImg.src = spriteImages[spriteIndex];
        spriteImg.alt = `Savage sprite ${spriteIndex + 1}`;
        spriteImg.onerror = () => {
            console.warn(`Failed to load sprite image: ${spriteImg.src}`);
            spriteImg.src = fallbackImage;
            spriteImg.alt = 'Fallback sprite';
            spriteImg.onerror = null;
        };
        spriteIndex = (spriteIndex + 1) % spriteImages.length;
    }
    cycleSprite();
    setInterval(cycleSprite, 5000);

    function moveSprite() {
        const maxX = window.innerWidth - 60;
        const maxY = window.innerHeight - 60;
        const targetX = Math.random() * maxX;
        const targetY = Math.random() * maxY;
        sprite.style.left = `${targetX}px`;
        sprite.style.top = `${targetY}px`;
    }
    moveSprite();
    setInterval(moveSprite, 3000);

    function updateCountdown() {
        const now = new Date();
        const nextStream = new Date();
        nextStream.setHours(20, 0, 0, 0);
        if (now > nextStream) nextStream.setDate(nextStream.getDate() + 1);
        const diff = nextStream - now;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        document.getElementById('stream-countdown').textContent = `${hours}h ${minutes}m`;
    }
    updateCountdown();
    setInterval(updateCountdown, 60000);

    function startTyping() {
        new Typed('#typed-text', {
            strings: [
                'Welcome to GameVibeHub!',
                'Slam *Hearthstone* cards live!',
                'Watch epic *YouTube Shorts*!',
                'Build *Minecraft* worlds!',
                'Drop *Fortnite* dubs with us!',
                'Create viral AI memes!',
                'Join global gaming challenges!',
                'Vibe with #GameVibeHub!'
            ],
            typeSpeed: 50,
            backSpeed: 30,
            backDelay: 1000,
            loop: true,
            showCursor: true,
            cursorChar: '█'
        });
    }

    let hasTriggeredTyping = false;
    function checkVisibility() {
        const heroElement = document.getElementById('hero');
        if (!hasTriggeredTyping && heroElement) {
            startTyping();
            hasTriggeredTyping = true;
        }
        document.querySelectorAll('section').forEach(section => {
            section.classList.add('visible');
            section.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
        });
    }
    function animate() {
        checkVisibility();
        requestAnimationFrame(animate);
    }
    animate();

    function requestNotificationPermission() {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Notification permission granted');
                }
            });
        }
    }

    function sendLiveNotification() {
        if (Notification.permission === 'granted') {
            new Notification('GameVibeHub Live!', {
                body: '@whispers_from_within is streaming now on TikTok! Join the action! #GameVibeHub',
                icon: '../assets/images/sprite1.jpg'
            });
        }
    }

    setInterval(() => {
        const now = new Date();
        if (now.getHours() === 20 && now.getMinutes() < 5) {
            sendLiveNotification();
        }
    }, 60000);
    requestNotificationPermission();

    const tiktokEmbed = document.getElementById('tiktok-embed');
    const tiktokFallback = document.getElementById('tiktok-fallback');
    function checkTikTokLoad() {
        const iframe = tiktokEmbed.querySelector('iframe');
        const isEmbedEmpty = !iframe || !iframe.contentDocument || iframe.contentDocument.body.innerHTML === '';
        if (isEmbedEmpty) {
            console.warn('TikTok embed empty. Showing fallback.');
            tiktokFallback.style.display = 'block';
        } else {
            console.log('TikTok embed loaded');
            tiktokFallback.style.display = 'none';
        }
    }
    setTimeout(checkTikTokLoad, 3000);
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadApiKey();
    initializeAppFeatures();
    initializeChat(OPENAI_API_KEY, database, auth);
    initializeMemes(OPENAI_API_KEY, database, auth);
    initializePolls(database, auth);
    initializeLeaderboard(database, auth);
    initializeGallery(database, auth);
    initializeQuotes();
    initializeWins(database, auth);
    initializeNewsletter(database);
    initializeDiscord();
    console.log('GameVibeHub initialized successfully');
});