import { appState } from './state.js';
import { updateServeUI, updateZone1Actions } from './serve-ui.js';

// Основные экспортируемые функции
export function placePlayerOnField(field, number, name, color, zone) {
    field.textContent = name;
    field.style.backgroundColor = color;
    field.classList.replace('empty', 'filled');

    // Обновляем состояние игроков на поле
    appState.playersOnField[number] = zone;
    field.onclick = () => window.openSubstitutionModal(field);

    if (zone === '1' || zone === '4') {
        updateZone1Actions();
    }
}


export function returnPlayerToBench(playerNumber) {
    delete appState.playersOnField[playerNumber];
}


export function initPlayerTags() {
    document.querySelectorAll('#players-header .player-tag').forEach(player => {
        player.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('playerNumber', this.dataset.number);
            e.dataTransfer.setData('playerName',
                `#${this.dataset.number} ${this.dataset.lastName} ${this.dataset.firstName}`);
            e.dataTransfer.setData('playerColor', this.style.backgroundColor);
        });

        player.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
            this.style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
        });

        player.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
    });
}

export function resetField(field) {
    const zone = field.closest('[data-zone]').dataset.zone;
    field.textContent = `Зона ${zone}`;
    field.style.backgroundColor = '#e0e0e0';
    field.classList.replace('filled', 'empty');
    field.onclick = () => window.openSubstitutionModal(field);
}


export function clearAllPlayers() {
    document.querySelectorAll('.player-field.filled').forEach(field => {
        const playerNumber = field.textContent.match(/#(\d+)/)?.[1];
        if (playerNumber) {
            returnPlayerToBench(playerNumber);
            resetField(field);
        }
    });
}

// НОВЫЙ КОД ДЛЯ ЗАМЕНЫ ИГРОКОВ
export function openSubstitutionModal(fieldElement) {
    const zone = fieldElement.closest('[data-zone]').dataset.zone;

    // Получаем список всех игроков из данных, переданных Flask
    const allPlayers = window.playersData || [];

    // Игроки на замене (не на поле)
    const benchPlayers = allPlayers.filter(player =>
        !Object.values(appState.playersOnField).includes(player.number.toString())
    );

    // Создаем контент модального окна
    const modalContent = `
        <h3>Замена для зоны ${zone}</h3>
        <div class="substitute-players-list">
            ${benchPlayers.map(player => `
                <button class="substitute-btn"
                        data-number="${player.number}"
                        data-name="${player.last_name} ${player.first_name[0]}."
                        data-color="${player.color}"
                        onclick="window.substitutePlayer('${zone}', this)">
                    #${player.number} - ${player.last_name} ${player.first_name[0]}.
                </button>
            `).join('')}
        </div>
    `;

    // Используем существующее модальное окно
    const modal = document.getElementById('substitution-modal');
    const content = modal.querySelector('.modal-content');
    content.innerHTML = modalContent;

    modal.style.display = 'block';
}

export function substitutePlayer(zone, buttonElement) {
    const playerNumber = buttonElement.dataset.number;
    const playerName = buttonElement.dataset.name;
    const playerColor = buttonElement.dataset.color;

    const zoneElement = document.querySelector(`[data-zone="${zone}"]`);
    const fieldElement = zoneElement.querySelector('.player-field');

    // Если в зоне уже есть игрок - возвращаем его на скамейку
    if (fieldElement.classList.contains('filled')) {
        const currentPlayerNumber = fieldElement.textContent.match(/#(\d+)/)?.[1];
        if (currentPlayerNumber) {
            returnPlayerToBench(currentPlayerNumber);
        }
    }

    // Размещаем нового игрока
    placePlayerOnField(fieldElement, playerNumber, playerName, playerColor, zone);

    // Закрываем модальное окно
    document.getElementById('substitution-modal').style.display = 'none';
}

// Экспортируем функции в глобальную область
window.placePlayerOnField = placePlayerOnField;
window.returnPlayerToBench = returnPlayerToBench;
window.openSubstitutionModal = openSubstitutionModal;
window.substitutePlayer = substitutePlayer;
window.clearAllPlayers = clearAllPlayers;
