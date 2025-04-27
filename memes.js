import { ref, push } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';
import { addVibePoints } from './utils.js';

export function initializeMemes(OPENAI_API_KEY, database, auth) {
    const memeInput = document.getElementById('meme-input');
    const memeTemplate = document.getElementById('meme-template');
    const generateMeme = document.getElementById('generate-meme');
    const memePreviews = document.getElementById('meme-previews');
    const shareMemeX = document.getElementById('share-meme-x');
    const shareMemeTikTok = document.getElementById('share-meme-tiktok');
    const memeCanvas = document.getElementById('meme-image');
    const downloadMeme = document.getElementById('download-meme');
    const memeError = document.getElementById('meme-error');
    const ctx = memeCanvas.getContext('2d');
    const COOLDOWN_MS = 5000;
    let lastRequestTime = 0;
    let currentUser = null;

    auth.onAuthStateChanged(user => {
        currentUser = user ? { username: document.getElementById('user-greeting').textContent.split('!')[0].replace('Welcome, ', '') } : null;
    });

    function drawFallbackMeme(text) {
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(0, 0, 300, 200);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(10, 10, 280, 180);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(120, 80, 60, 40);
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Press Start 2P';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#000000';
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        const lines = text.match(/.{1,20}(\s|$)/g) || [text];
        lines.forEach((line, i) => {
            ctx.fillText(line.trim(), 150, 100 + i * 20);
        });
    }

    async function generateMemeCaption(text, retryCount = 0) {
        const now = Date.now();
        if (now - lastRequestTime < COOLDOWN_MS) {
            memeError.textContent = 'Slow down! Wait a moment before generating another meme.';
            memeError.classList.remove('hidden');
            return text;
        }
        lastRequestTime = now;

        if (!OPENAI_API_KEY) {
            memeError.textContent = 'Cannot generate caption: API key not loaded.';
            memeError.classList.remove('hidden');
            return text;
        }
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: `Create a funny, gaming-themed meme caption for: "${text}". Keep it short (under 20 words). Timestamp: ${now}` }],
                    max_tokens: 30,
                    temperature: 1.0
                })
            });

            if (!response.ok) {
                if (response.status === 429 && retryCount < 3) {
                    const delay = Math.pow(2, retryCount) * 4000;
                    console.warn(`Rate limit hit for caption. Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return generateMemeCaption(text, retryCount + 1);
                }
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            return data.choices && data.choices[0].message.content ? data.choices[0].message.content.trim() : text;
        } catch (error) {
            console.error('Meme caption error:', error);
            memeError.textContent = error.message.includes('429')
                ? 'AI is overloaded! Try again in a minute.'
                : `Caption error: ${error.message}`;
            memeError.classList.remove('hidden');
            return text;
        }
    }

    async function generateMemes(text, template) {
        memePreviews.innerHTML = '<p>Generating meme...</p>';
        memeError.classList.add('hidden');
        const caption = await generateMemeCaption(text || 'Your Meme Here');
        const words = caption.split(' ');
        const half = Math.ceil(words.length / 2);
        const topText = words.slice(0, half).join(' ').toUpperCase();
        const bottomText = words.slice(half).join(' ').toUpperCase();

        const templateUrls = {
            drake: 'https://i.imgflip.com/1bilmd.jpg',
            distracted_bf: 'https://i.imgflip.com/1ur9b0.jpg',
            grumpy_cat: 'https://i.imgflip.com/1bgw.jpg',
            spongebob: 'https://i.imgflip.com/1otk96.jpg'
        };

        try {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = templateUrls[template];
            img.onload = () => {
                ctx.drawImage(img, 0, 0, 300, 200);
                ctx.fillStyle = 'white';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 4;
                ctx.font = '20px Impact';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.strokeText(topText, 150, 10);
                ctx.fillText(topText, 150, 10);
                ctx.textBaseline = 'bottom';
                ctx.strokeText(bottomText, 150, 190);
                ctx.fillText(bottomText, 150, 190);
                memePreviews.innerHTML = '';
                const canvasImg = document.createElement('img');
                canvasImg.src = memeCanvas.toDataURL();
                canvasImg.alt = 'Generated meme';
                canvasImg.style.maxWidth = '180px';
                memePreviews.appendChild(canvasImg);
                downloadMeme.classList.remove('hidden');
                push(ref(database, 'memes'), { text: caption, url: canvasImg.src, username: currentUser?.username || 'Anonymous', timestamp: Date.now() });
                addVibePoints('meme_generate', 30, auth, database);
            };
            img.onerror = () => {
                drawFallbackMeme(caption);
                memePreviews.innerHTML = '';
                const canvasImg = document.createElement('img');
                canvasImg.src = memeCanvas.toDataURL();
                canvasImg.alt = 'Generated meme';
                canvasImg.style.maxWidth = '180px';
                memePreviews.appendChild(canvasImg);
                downloadMeme.classList.remove('hidden');
                push(ref(database, 'memes'), { text: caption, url: canvasImg.src, username: currentUser?.username || 'Anonymous', timestamp: Date.now() });
                addVibePoints('meme_generate', 30, auth, database);
            };
        } catch (error) {
            console.error('Meme generation error:', error);
            drawFallbackMeme(caption);
            memePreviews.innerHTML = '';
            const canvasImg = document.createElement('img');
            canvasImg.src = memeCanvas.toDataURL();
            canvasImg.alt = 'Generated meme';
            canvasImg.style.maxWidth = '180px';
            memePreviews.appendChild(canvasImg);
            downloadMeme.classList.remove('hidden');
            memeError.textContent = 'Failed to load meme template. Using fallback.';
            memeError.classList.remove('hidden');
            addVibePoints('meme_generate', 30, auth, database);
        }
    }

    generateMeme.addEventListener('click', () => {
        const text = memeInput.value || 'Your Meme Here';
        const template = memeTemplate.value;
        generateMemes(text, template);
    });

    shareMemeX.addEventListener('click', async () => {
        const memeUrl = memePreviews.querySelector('img')?.src || 'https://<username>.github.io/gamevibehub/';
        const text = encodeURIComponent('Check out my epic #GameVibeHub meme! Join @whispers_from_within! 🎮');
        window.open(`https://x.com/share?url=${encodeURIComponent(memeUrl)}&text=${text}`, '_blank');
        await addVibePoints('share_x', 20, auth, database);
    });

    shareMemeTikTok.addEventListener('click', async () => {
        const text = 'Created an epic meme on GameVibeHub! Join @whispers_from_within! #GameVibeHub';
        window.open('https://www.tiktok.com/', '_blank');
        await addVibePoints('share_tiktok', 20, auth, database);
    });

    downloadMeme.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = memeCanvas.toDataURL('image/png');
        link.download = 'gamevibehub-meme.png';
        link.click();
    });

    drawFallbackMeme('Your Meme Here');
}