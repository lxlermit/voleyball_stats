export function initSubstitutions() {
    // Добавляем обработчик клика на все player-field
    document.querySelectorAll('.player-field').forEach(field => {
        field.addEventListener('click', function() {
            openSubstitutionModal(this);
        });
    });

    function openSubstitutionModal(playerField) {
        const modal = document.getElementById('substitution-modal');
        const playersList = document.getElementById('substitute-players');
        playersList.innerHTML = '';

        // Получаем текущих игроков на поле
        const currentPlayers = new Set();
        document.querySelectorAll('.player-field').forEach(field => {
            const num = field.dataset.playerNumber;
            if (num) currentPlayers.add(num);
        });

        // Получаем список всех игроков из глобальной переменной
        const allPlayers = window.playersData || [];

        allPlayers.forEach(player => {
            if (!currentPlayers.has(player.number)) {
                const playerBtn = document.createElement('button');
                playerBtn.className = 'substitute-player-btn';
                playerBtn.textContent = `${player.number} - ${player.last_name} ${player.first_name[0]}.`;
                playerBtn.onclick = () => {
                    substitutePlayer(playerField, player);
                    modal.style.display = 'none';
                };
                playersList.appendChild(playerBtn);
            }
        });

        modal.style.display = 'block';

        modal.querySelector('.close').onclick = () => {
            modal.style.display = 'none';
        };
    }

    function substitutePlayer(playerField, newPlayer) {
        const zone = playerField.dataset.zone;
        playerField.dataset.playerNumber = newPlayer.number;
        playerField.textContent = `${newPlayer.number} - ${newPlayer.last_name} ${newPlayer.first_name[0]}.`;

        // Обновляем данные в session (можно добавить AJAX-запрос к серверу)
        console.log(`Замена в зоне ${zone}: ${newPlayer.number}`);
    }
}