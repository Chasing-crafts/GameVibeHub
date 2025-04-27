import { ref, push, get, onValue } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';
import { addVibePoints } from './utils.js';

export function initializeWins(database, auth) {
    const submitWin = document.getElementById('submit-win');
    const winGame = document.getElementById('win-game');
    const winDescription = document.getElementById('win-description');
    const winMedia = document.getElementById('win-media');
    const bigWinCarousel = document.getElementById('big-win-carousel');
    const winError = document.getElementById('win-error');
    let currentUser = null;

    auth.onAuthStateChanged(user => {
        currentUser = user ? { uid: user.uid, username: document.getElementById('user-greeting').textContent.split('!')[0].replace('Welcome, ', '') } : null;
    });

    async function updateWins() {
        try {
            const snapshot = await get(ref(database, 'wins'));
            bigWinCarousel.innerHTML = '';
            if (snapshot.exists()) {
                snapshot.forEach(child => {
                    const { game, description, media, username } = child.val();
                    const isVideo = media.endsWith('.mp4') || media.endsWith('.webm') || media.endsWith('.mov');
                    const winCard = document.createElement('div');
                    winCard.className = 'big-win-card';
                    winCard.innerHTML = `
                        ${isVideo ? 
                            `<video src="${media}" controls autoplay loop muted playsinline class="rounded-lg" onerror="this.src='https://placehold.co/300x180/ffd700/ffffff?text=Video+Failed'; this.onerror=null;"></video>` :
                            `<img src="${media}" alt="${description}" class="rounded-lg" onerror="this.src='https://placehold.co/300x180/ffd700/ffffff?text=Image+Failed'; this.onerror=null;">`
                        }
                        <p class="text-gray-300 text-sm mt-2"><strong>${username}</strong> in ${game}: ${description}</p>
                    `;
                    bigWinCarousel.appendChild(winCard);
                });
            } else {
                bigWinCarousel.innerHTML = '<p class="text-gray-400">No wins yet. Share yours!</p>';
            }
        } catch (error) {
            console.error('Wins error:', error);
            bigWinCarousel.innerHTML = '<p class="error-message">Error loading wins.</p>';
        }
    }

    submitWin.addEventListener('click', async () => {
        if (!currentUser) {
            alert('Please sign up or log in to share a win!');
            document.getElementById('auth-modal').classList.add('open');
            return;
        }
        const game = winGame.value;
        const description = winDescription.value.trim();
        const media = winMedia.value.trim();
        if (!description || !media) {
            winError.textContent = 'Please enter both description and media URL.';
            winError.classList.remove('hidden');
            return;
        }
        try {
            await push(ref(database, 'wins'), {
                game,
                description,
                media,
                username: currentUser.username,
                timestamp: Date.now()
            });
            await addVibePoints('win_submit', 50, auth, database);
            winDescription.value = '';
            winMedia.value = '';
            winError.classList.add('hidden');
            updateWins();
        } catch (error) {
            console.error('Win submission error:', error);
            winError.textContent = `Submission error: ${error.message}`;
            winError.classList.remove('hidden');
        }
    });

    onValue(ref(database, 'wins'), () => {
        updateWins();
    });

    updateWins();
}