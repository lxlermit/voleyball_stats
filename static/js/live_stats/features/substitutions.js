export function initSubstitutions() {
    window.openSubstitutionModal = function(playerField) {
        const modal = document.getElementById('substitution-modal');
        const playersList = document.getElementById('substitute-players');

        // Очищаем предыдущий список
        playersList.innerHTML = '';

        // Получаем текущих игроков на поле
        const currentPlayers = new Set();
        document.querySelectorAll('.player-field').forEach(field => {
            const num = field.dataset.playerNumber;
            if (num) currentPlayers.add(num);
        });

        // Добавляем запасных игроков
        window.state.players.forEach(player => {
            if (!currentPlayers.has(player.number)) {
                const playerBtn = document.createElement('button');
                playerBtn.className = 'substitute-player-btn';
                playerBtn.textContent = `${player.number} - ${player.name}`;
                playerBtn.onclick = () => {
                    substitutePlayer(playerField, player);
                    modal.style.display = 'none';
                };
                playersList.appendChild(playerBtn);
            }
        });

        // Показываем модальное окно
        modal.style.display = 'block';

        // Закрытие по клику на крестик
        modal.querySelector('.close').onclick = () => {
            modal.style.display = 'none';
        };
    };

    function substitutePlayer(playerField, newPlayer) {
        // Обновляем данные на поле
        playerField.dataset.playerNumber = newPlayer.number;
        playerField.textContent = `${newPlayer.number} - ${newPlayer.name}`;

        // Здесь можно добавить логику сохранения изменений в state/session
        console.log(`Игрок ${newPlayer.number} заменен в зоне ${playerField.dataset.zone}`);
    }
}