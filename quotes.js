export function initializeQuotes() {
    const dailyQuote = document.getElementById('daily-quote');
    const newQuote = document.getElementById('new-quote');

    const quotes = [
        "In gaming, as in life, every loss is a lesson. Keep grinding! – Anonymous",
        "A true gamer never quits; they respawn and fight again! – GameVibeHub",
        "Hearthstone or Fortnite, the real battle is in the vibes! – Whispers",
        "Build epic in Minecraft, live epic in reality! – GameVibeHub",
        "Clutch plays come from heart, not just skill. – Anonymous"
    ];

    function displayQuote() {
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        dailyQuote.textContent = randomQuote;
    }

    newQuote.addEventListener('click', () => {
        displayQuote();
    });

    displayQuote();
}