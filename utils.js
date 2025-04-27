import { ref, get, update } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

export async function addVibePoints(action, points, auth, database) {
    const user = auth.currentUser;
    if (!user) return;
    try {
        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            const currentPoints = snapshot.val().points || 0;
            await update(userRef, { points: currentPoints + points });
            document.getElementById('user-greeting').textContent = `Welcome, ${snapshot.val().username}! (${currentPoints + points} Vibe Points)`;
            console.log(`Added ${points} Vibe Points for ${action}`);
        }
    } catch (error) {
        console.error('Vibe Points error:', error);
    }
}