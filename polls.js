import { ref, get, set, onValue } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';
import { addVibePoints } from './utils.js';

export function initializePolls(database, auth) {
    const pollButtons = document.querySelectorAll('.poll-btn');
    const pollResults = document.getElementById('poll-results');
    let currentUser = null;

    auth.onAuthStateChanged(user => {
        currentUser = user ? { uid: user.uid, username: document.getElementById('user-greeting').textContent.split('!')[0].replace('Welcome, ', '') } : null;
    });

    async function updatePollResults() {
        try {
            const games = ['hearthstone', 'fortnite', 'minecraft'];
            let totalVotes = 0;
            const results = {};
            for (const game of games) {
                const snapshot = await get(ref(database, `polls/${game}`));
                results[game] = snapshot.exists() ? snapshot.val().votes || 0 : 0;
                totalVotes += results[game];
            }
            let resultsHtml = '<h3 class="text-lg font-bold mb-2">Poll Results:</h3>';
            for (const game of games) {
                const percentage = totalVotes ? ((results[game] / totalVotes) * 100).toFixed(1) : 0;
                resultsHtml += `<p>${game.charAt(0).toUpperCase() + game.slice(1)}: ${results[game]} votes (${percentage}%)</p>`;
            }
            pollResults.innerHTML = resultsHtml;
        } catch (error) {
            console.error('Poll results error:', error);
            pollResults.innerHTML = '<p class="error-message">Error loading results.</p>';
        }
    }

    pollButtons.forEach(button => {
        button.addEventListener('click', async () => {
            if (!currentUser) {
                alert('Please sign up or log in to vote and earn Vibe Points!');
                document.getElementById('auth-modal').classList.add('open');
                return;
            }
            const game = button.dataset.game;
            try {
                const userVoteRef = ref(database, `user_votes/${currentUser.uid}/${game}`);
                const userVoteSnapshot = await get(userVoteRef);
                if (userVoteSnapshot.exists()) {
                    pollResults.innerHTML += '<p class="error-message mt-2">You’ve already voted for this game!</p>';
                    return;
                }
                const gameRef = ref(database, `polls/${game}`);
                const snapshot = await get(gameRef);
                const currentVotes = snapshot.exists() ? snapshot.val().votes || 0 : 0;
                await set(gameRef, { votes: currentVotes + 1 });
                await set(userVoteRef, { timestamp: Date.now() });
                await addVibePoints('poll_vote', 10, auth, database);
                updatePollResults();
            } catch (error) {
                console.error('Poll vote error:', error);
                pollResults.innerHTML += `<p class="error-message mt-2">Vote error: ${error.message}</p>`;
            }
        });
    });

    onValue(ref(database, 'polls'), () => {
        updatePollResults();
    });

    updatePollResults();
}