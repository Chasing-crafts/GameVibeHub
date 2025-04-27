import { ref, push, get, onValue } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';
import { addVibePoints } from './utils.js';

export function initializeGallery(database, auth) {
    const submitImage = document.getElementById('submit-image');
    const imageUrl = document.getElementById('image-url');
    const caption = document.getElementById('caption');
    const galleryImages = document.getElementById('gallery-images');
    let currentUser = null;

    auth.onAuthStateChanged(user => {
        currentUser = user ? { uid: user.uid, username: document.getElementById('user-greeting').textContent.split('!')[0].replace('Welcome, ', '') } : null;
    });

    async function updateGallery() {
        try {
            const snapshot = await get(ref(database, 'gallery'));
            galleryImages.innerHTML = '';
            if (snapshot.exists()) {
                snapshot.forEach(child => {
                    const { url, caption: imageCaption, username } = child.val();
                    const imgDiv = document.createElement('div');
                    imgDiv.className = 'relative';
                    imgDiv.innerHTML = `
                        <img src="${url}" alt="${imageCaption}" class="max-w-xs rounded-lg shadow-lg" onerror="this.src='https://placehold.co/300x200/ffd700/ffffff?text=Image+Failed'; this.onerror=null;">
                        <p class="text-gray-300 text-sm mt-2">By ${username}: ${imageCaption}</p>
                    `;
                    galleryImages.appendChild(imgDiv);
                });
            } else {
                galleryImages.innerHTML = '<p class="text-gray-400">No images yet. Share yours!</p>';
            }
        } catch (error) {
            console.error('Gallery error:', error);
            galleryImages.innerHTML = '<p class="error-message">Error loading gallery.</p>';
        }
    }

    submitImage.addEventListener('click', async () => {
        if (!currentUser) {
            alert('Please sign up or log in to share an image!');
            document.getElementById('auth-modal').classList.add('open');
            return;
        }
        const url = imageUrl.value.trim();
        const imageCaption = caption.value.trim();
        if (!url || !imageCaption) {
            galleryImages.innerHTML += '<p class="error-message mt-2">Please enter both image URL and caption.</p>';
            return;
        }
        try {
            await push(ref(database, 'gallery'), {
                url,
                caption: imageCaption,
                username: currentUser.username,
                timestamp: Date.now()
            });
            await addVibePoints('image_submit', 25, auth, database);
            imageUrl.value = '';
            caption.value = '';
            updateGallery();
        } catch (error) {
            console.error('Image submission error:', error);
            galleryImages.innerHTML += `<p class="error-message mt-2">Submission error: ${error.message}</p>`;
        }
    });

    onValue(ref(database, 'gallery'), () => {
        updateGallery();
    });

    updateGallery();
}