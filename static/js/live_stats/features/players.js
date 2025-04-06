import { appState } from '../core/state.js';
import { updateZone1Actions } from '../ui/serve-ui.js';

// Основные экспортируемые функции
export function placePlayerOnField(field, number, name, color, zone) {
    field.textContent = name;
    field.style.backgroundColor = color;
    field.classList.replace('empty', 'filled');

    document.querySelector(`#players-header .player-tag[data-number="${number}"]`)
        .style.display = 'none';

    appState.playersOnField[number] = zone;
    field.onclick = () => window.openRemoveModal(number, field);

    if (zone === '1' || zone === '4') {
        updateZone1Actions();
    }
}

export function returnPlayerToBench(playerNumber) {
    const playerElement = document.querySelector(
        `#players-header .player-tag[data-number="${playerNumber}"]`
    );
    if (playerElement) {
        playerElement.style.display = 'inline-block';
    }
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

    const newField = field.cloneNode(true);
    field.replaceWith(newField);
    window.setupFieldEvents(newField);
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

// Экспортируем функции в глобальную область для court.js
window.placePlayerOnField = placePlayerOnField;
window.returnPlayerToBench = returnPlayerToBench;