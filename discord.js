export function initializeDiscord() {
    const discordToggle = document.getElementById('discord-toggle');
    const discordWidget = document.getElementById('discord-widget');

    discordToggle.addEventListener('click', () => {
        discordWidget.classList.toggle('hidden');
        discordToggle.textContent = discordWidget.classList.contains('hidden') ? 'Show Discord Invite' : 'Hide Discord Invite';
    });
}