import { ref, push } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';
import { addVibePoints } from './utils.js';

export function initializeChat(OPENAI_API_KEY, database, auth) {
    const grokToggle = document.getElementById('grok-toggle');
    const grokPanel = document.getElementById('grok-panel');
    const grokChat = document.getElementById('grok-chat');
    const chatInput = document.getElementById('chat-input');
    const chatSubmit = document.getElementById('chat-submit');
    const roastMe = document.getElementById('roast-me');
    const chatError = document.getElementById('chat-error');
    const COOLDOWN_MS = 5000;
    let lastRequestTime = 0;
    let currentUser = null;

    auth.onAuthStateChanged(user => {
        currentUser = user ? { username: document.getElementById('user-greeting').textContent.split('!')[0].replace('Welcome, ', '') } : null;
    });

    function addChatMessage(message, isUser = false) {
        const div = document.createElement('div');
        div.className = `chat-message ${isUser ? 'text-right bg-indigo-600' : 'bg-gray-800'}`;
        div.textContent = message;
        grokChat.appendChild(div);
        grokChat.scrollTop = grokChat.scrollHeight;
    }

    async function sendChatMessage(message, type = 'chat', retryCount = 0) {
        const now = Date.now();
        if (now - lastRequestTime < COOLDOWN_MS) {
            const errorMsg = 'Slow down! Wait a moment before chatting again.';
            addChatMessage(errorMsg);
            chatError.textContent = errorMsg;
            chatError.classList.remove('hidden');
            return;
        }
        lastRequestTime = now;

        if (!OPENAI_API_KEY) {
            const errorMsg = 'Cannot connect to AI: API key not loaded.';
            addChatMessage(errorMsg);
            chatError.textContent = errorMsg;
            chatError.classList.remove('hidden');
            return;
        }

        const prompt = type === 'welcome' 
            ? `You're a witty AI on GameVibeHub. Generate a unique, funny welcome message for a new user. Include a gaming reference and keep it under 50 words. Timestamp: ${now}`
            : type === 'roast'
            ? `You're a witty AI on GameVibeHub. Roast the user in a funny, gaming-themed way (e.g., Hearthstone, Fortnite). Keep it light, playful, and under 50 words. Timestamp: ${now}`
            : `You're a witty AI on GameVibeHub. Respond to: "${message}" with a funny, gaming-themed reply. Keep it light, under 50 words, and include a gaming reference. Timestamp: ${now}`;

        try {
            addChatMessage('Thinking...', false);
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 50,
                    temperature: 1.0,
                    top_p: 0.95
                })
            });

            if (!response.ok) {
                if (response.status === 429 && retryCount < 3) {
                    const delay = Math.pow(2, retryCount) * 4000;
                    console.warn(`Rate limit hit. Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return sendChatMessage(message, type, retryCount + 1);
                }
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            if (data.choices && data.choices[0].message.content) {
                const reply = data.choices[0].message.content.trim();
                grokChat.lastChild.remove();
                addChatMessage(reply);
                if (type !== 'welcome') {
                    push(ref(database, 'chat'), { message: reply, username: currentUser?.username || 'Anonymous', timestamp: Date.now() });
                }
                chatError.classList.add('hidden');
                if (type === 'roast') await addVibePoints('roast', 15, auth, database);
            } else {
                throw new Error('No response from OpenAI');
            }
        } catch (error) {
            grokChat.lastChild.remove();
            const errorMsg = error.message.includes('429')
                ? 'AI is overloaded! Try again in a minute.'
                : `AI error: ${error.message}.`;
            addChatMessage(errorMsg);
            chatError.textContent = errorMsg;
            chatError.classList.remove('hidden');
            console.error('Chat error:', error);
        }
    }

    grokToggle.addEventListener('click', async () => {
        grokPanel.classList.toggle('open');
        if (grokPanel.classList.contains('open')) {
            grokChat.innerHTML = '';
            addChatMessage('Connecting to GameVibeHub AI...');
            await sendChatMessage('', 'welcome');
        }
    });

    chatSubmit.addEventListener('click', async () => {
        const message = chatInput.value.trim();
        if (message) {
            addChatMessage(message, true);
            chatInput.value = '';
            await sendChatMessage(message, 'chat');
        }
    });

    roastMe.addEventListener('click', async () => {
        addChatMessage('Brace yourself for an epic roast!');
        await sendChatMessage('', 'roast');
    });
}