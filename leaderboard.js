import { ref, push, get, onValue } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';
import { addVibePoints } from './utils.js';

export function initializeLeaderboard(database, auth) {
    const submitScore = document.getElementById('submit-score');
    const scoreInput = document.getElementById('score');
    const leaderboardList = document.getElementById('leaderboard-list');
    let currentUser = null;

    auth.onAuthStateChanged(user => {
        currentUser = user ? { uid: user.uid, username: document.getElementById('user-greeting').textContent.split('!')[0].replace('Welcome, ', '') } : null;
    });

    async function updateLeaderboard() {
        try {
            const snapshot = await get(ref(database, 'leaderboard'));
            const scores = [];
            if (snapshot.exists()) {
                snapshot.forEach(child => {
                    scores.push(child.val());
                });
            }
            scores.sort((a, b) => b.score - a.score);
            let leaderboardHtml = '<h3 class="text-lg font-bold mb-2">Top Players:</h3>';
            scores.slice(0, 10).forEach((entry, index) => {
                leaderboardHtml += `<p>${index + 1}. ${entry.username}: ${entry.score} points</p>`;
            });
            leaderboardList.innerHTML = leaderboardHtml;
        } catch (error) {
            console.error('Leaderboard error:', error);
            leaderboardList.innerHTML = '<p class="error-message">Error loading leaderboard.</p>';
        }
    }

    submitScore.addEventListener('click', async () => {
        if (!currentUser) {
            alert('Please sign up or log in to submit a score!');
            document.getElementById('auth-modal').classList.add('open');
            return;
        }
        const score = parseInt(scoreInput.value);
        if (isNaN(score) || score <= 0) {
            leaderboardList.innerHTML += '<p class="error-message mt-2">Please enter a valid score.</p>';
            return;
        }
        try {
            await push(ref(database, 'leaderboard'), {
                username: currentUser.username,
                score,
                timestamp: Date.now()
            });
            await addVibePoints('score_submit', 20, auth, database);
            scoreInput.value = '';
            updateLeaderboard();
        } catch (error) {
            console.error('Score submission error:', error);
            leaderboardList.innerHTML += `<p class="error-message mt-2">Submission error: ${error.message}</p>`;
        }
    });

    onValue(ref(database, 'leaderboard'), () => {
        updateLeaderboard();
    });

    updateLeaderboard();
}