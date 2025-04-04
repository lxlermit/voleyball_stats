// Глобальное состояние
const appState = {
    playersOnField: {},
    isFlipped: false,
    isOurServe: true,
    zoneMapping: {
        1: 4, 2: 5, 3: 6, 4: 1, 5: 2, 6: 3
    }
};

const matchState = {
    currentSet: 1,
    maxSets: 5,
    ourScore: 0,
    opponentScore: 0,
    sets: {}
};

let longPressTimer = null;
const LONG_PRESS_DURATION = 500; // 0.5 секунды для долгого нажатия


// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    initPlayerTags();
    initZoneFields();
    initModal();
    initScoreControls();
    updateServeUI();
    updateZone1Actions();
    initSettingsModal();
});

// Инициализация тегов игроков
function initPlayerTags() {
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

// Инициализация зон поля
function initZoneFields() {
    document.querySelectorAll('.player-field.empty').forEach(field => {
        setupFieldEvents(field);
    });
}

// Настройка событий для поля
function setupFieldEvents(field) {
    field.addEventListener('dragover', function(e) {
        e.preventDefault();
        if (this.classList.contains('empty')) {
            this.style.backgroundColor = '#d0d0d0';
        }
    });

    field.addEventListener('dragleave', function() {
        if (this.classList.contains('empty')) {
            this.style.backgroundColor = '#e0e0e0';
        }
    });

    field.addEventListener('drop', function(e) {
        e.preventDefault();
        const zone = this.closest('[data-zone]').dataset.zone;
        const playerNumber = e.dataTransfer.getData('playerNumber');
        const playerName = e.dataTransfer.getData('playerName');
        const playerColor = e.dataTransfer.getData('playerColor');

        if (this.classList.contains('filled')) {
            const currentPlayerNumber = this.textContent.match(/#(\d+)/)[1];
            returnPlayerToBench(currentPlayerNumber);
        }

        placePlayerOnField(this, playerNumber, playerName, playerColor, zone);
    });
}

// Размещение игрока на поле
function placePlayerOnField(field, number, name, color, zone) {
    field.textContent = name;
    field.style.backgroundColor = color;
    field.classList.replace('empty', 'filled');

    document.querySelector(`#players-header .player-tag[data-number="${number}"]`)
        .style.display = 'none';

    appState.playersOnField[number] = zone;
    field.onclick = () => openRemoveModal(number, field);

    if (zone === '1' || zone === '4') {
        updateZone1Actions();
    }
}

// Возврат игрока на скамейку
function returnPlayerToBench(playerNumber) {
    const playerElement = document.querySelector(
        `#players-header .player-tag[data-number="${playerNumber}"]`
    );
    if (playerElement) {
        playerElement.style.display = 'inline-block';
    }
    delete appState.playersOnField[playerNumber];
}

// Обновление UI подачи
function updateServeUI() {
    const serveButton = document.getElementById('serve-toggle-btn');
    if (serveButton) {
        serveButton.textContent = appState.isOurServe ? '🎾 Мы подаем' : '🎾 Соперник подает';
        serveButton.style.backgroundColor = appState.isOurServe ? '#4CAF50' : '#F44336';
    }
}

// Обновление действий в зоне 1
function updateZone1Actions() {
    const zone1 = document.getElementById('zone-1');
    if (!zone1) return;

    const currentZone = zone1.closest('[data-zone]');
    const oldServingRow = currentZone.querySelector('.serving-row');
    if (oldServingRow) {
        oldServingRow.remove();
    }

    if (appState.isOurServe) {
        const servingRow = document.createElement('div');
        servingRow.className = 'serving-row';
        servingRow.innerHTML = `
            <div class="serving-field ace-serve">Ace</div>
            <div class="serving-field normal-serve">Подача</div>
            <div class="serving-field error-serve">Подача -</div>
        `;

        const playerField = currentZone.querySelector('.player-field');
        if (playerField) {
            currentZone.insertBefore(servingRow, playerField);
        }

        servingRow.querySelectorAll('.serving-field').forEach(button => {
            button.addEventListener('click', function() {
                const playerNumber = currentZone.querySelector('.player-field.filled')?.textContent.match(/#(\d+)/)?.[1];
                if (playerNumber) {
                    const actionType = this.classList.contains('ace-serve') ? 'serve_ace' :
                                     this.classList.contains('error-serve') ? 'serve_error' : 'serve_normal';
                    recordPlayerAction(playerNumber, actionType, currentZone.dataset.zone);
                }
            });
        });
    }
}

// Переворот поля
function flipCourt() {
    const courtArea = document.getElementById('court-area');
    if (!courtArea) return;

    appState.isFlipped = !appState.isFlipped;
    courtArea.classList.toggle('flipped', appState.isFlipped);

    const zonesState = {};
    document.querySelectorAll('.net-zone, .back-zone').forEach(zone => {
        const currentZone = zone.dataset.zone;
        zonesState[currentZone] = {
            playerHtml: zone.querySelector('.player-field').outerHTML,
            actionRowsHtml: Array.from(zone.querySelectorAll('.action-row, .receive-row, .serving-row'))
                              .filter(row => row.innerHTML.trim() !== '')
                              .map(row => row.outerHTML),
            number: zone.querySelector('.player-field.filled')?.textContent.match(/#(\d+)/)?.[1]
        };
    });

    document.querySelectorAll('.net-zone, .back-zone').forEach(zone => {
        const currentZone = zone.dataset.zone;
        const targetZone = appState.zoneMapping[currentZone];

        zone.innerHTML = `
            ${zonesState[targetZone]?.actionRowsHtml.join('') || ''}
            ${zonesState[targetZone]?.playerHtml || `<div class="player-field empty" id="player-${targetZone}" data-zone="${targetZone}">Зона ${targetZone}</div>`}
        `;

        const playerField = zone.querySelector('.player-field');
        if (playerField.classList.contains('filled')) {
            const playerNumber = zonesState[targetZone]?.number;
            if (playerNumber) {
                playerField.onclick = () =>
                    openRemoveModal(playerNumber, playerField);
            }
        } else {
            setupFieldEvents(playerField);
        }

        zone.dataset.zone = targetZone;
        zone.id = `zone-${targetZone}`;
        setupActionButtons(zone);
    });

    updateZone1Actions();
}

// Настройка кнопок действий
function setupActionButtons(zone) {
    zone.querySelectorAll('.action-field').forEach(button => {
        // Обработчики для кнопки "Удар +"
        if (button.classList.contains('attack-plus')) {
            button.addEventListener('mousedown', startLongPress);
            button.addEventListener('mouseup', endLongPress);
            button.addEventListener('mouseleave', cancelLongPress);
            button.addEventListener('click', handleAttackPlusClick);
        } else {
            // Стандартная обработка других кнопок
            button.addEventListener('click', function() {
                const zoneNumber = zone.dataset.zone;
                const actionType = this.textContent.trim();
                const playerNumber = zone.querySelector('.player-field.filled')?.textContent.match(/#(\d+)/)?.[1];
                if (playerNumber) {
                    recordPlayerAction(playerNumber, actionType, zoneNumber);
                }
            });
        }
    });
}

// Настройка кнопок действий для всех зон
function setupActionButtonsForAllZones() {
    document.querySelectorAll('.net-zone, .back-zone').forEach(zone => {
        setupActionButtons(zone);
    });
}

// Запись действия игрока
function recordPlayerAction(playerNumber, actionType, zone) {
    console.log(`Игрок #${playerNumber} в зоне ${zone}: ${actionType}`);
    // Здесь будет логика отправки на сервер

    // Пример структуры для отправки на сервер:
    const actionData = {
        player: playerNumber,
        action: actionType,
        zone: zone,
        timestamp: new Date().toISOString()
    };

    // Отправка данных на сервер
    fetch('/record_action', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(actionData)
    })
    .then(response => {
        if (!response.ok) {
            console.error('Ошибка сохранения действия');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Инициализация модальных окон
function initModal() {
    const removeModalClose = document.querySelector('#remove-player-modal .close, #cancel-remove');
    if (removeModalClose) {
        removeModalClose.onclick = () => {
            document.getElementById('remove-player-modal').style.display = 'none';
        };
    }

    window.addEventListener('click', function(event) {
        if (event.target === document.getElementById('remove-player-modal')) {
            event.target.style.display = 'none';
        }
    });
}

// Открытие модального окна удаления игрока
function openRemoveModal(playerNumber, fieldElement) {
    const modal = document.getElementById('remove-player-modal');
    if (!modal) return;

    const playerInfo = document.getElementById('player-to-remove-info');
    if (playerInfo) {
        playerInfo.textContent = `Игрок #${playerNumber} будет отправлен на скамейку.`;
    }

    const confirmButton = document.getElementById('confirm-remove');
    if (confirmButton) {
        confirmButton.onclick = () => {
            returnPlayerToBench(playerNumber);
            resetField(fieldElement);
            modal.style.display = 'none';
        };
    }

    modal.style.display = 'block';
}

// Сброс поля
function resetField(field) {
    const zone = field.closest('[data-zone]').dataset.zone;
    field.textContent = `Зона ${zone}`;
    field.style.backgroundColor = '#e0e0e0';
    field.classList.replace('filled', 'empty');

    const newField = field.cloneNode(true);
    field.replaceWith(newField);
    setupFieldEvents(newField);
}

// Инициализация управления счетом
function initScoreControls() {
    document.getElementById('our-point-btn')?.addEventListener('click', () => {
        matchState.ourScore++;
        updateScoreDisplay();
    });

    document.getElementById('opponent-point-btn')?.addEventListener('click', () => {
        matchState.opponentScore++;
        updateScoreDisplay();
    });
}

// Обновление отображения счета
function updateScoreDisplay() {
    document.querySelector('.our-score').textContent = matchState.ourScore;
    document.querySelector('.opponent-score').textContent = matchState.opponentScore;
}

// В функции initSettingsModal обновляем обработчик для кнопки:
function initSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    // Обработчик открытия модального окна
    const settingsButton = document.getElementById('settings-btn');
    if (settingsButton) {
        settingsButton.addEventListener('click', function(e) {
            e.stopPropagation();
            modal.style.display = 'block';
        });
    }

    // Обработчик закрытия по крестику
    const closeButton = modal.querySelector('.close');
    if (closeButton) {
        closeButton.addEventListener('click', function(e) {
            e.stopPropagation();
            modal.style.display = 'none';
        });
    }

    // Обработчик закрытия по клику вне окна
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Обработчики для всех кнопок в модальном окне
    const setupModalButton = function(id, callback) {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                callback();
                modal.style.display = 'none';
            });
        }
    };

    // Назначаем обработчики для всех кнопок
    setupModalButton('mirror-btn', flipCourt);

    setupModalButton('serve-toggle-btn', function() {
        appState.isOurServe = !appState.isOurServe;
        updateServeUI();
        updateZone1Actions();
    });

    setupModalButton('clear-to-serve', function() {
        console.log('Очистка до подачи');
        // Реализуйте эту функцию
    });

    setupModalButton('undo-last-action', function() {
        console.log('Отмена до предыдущей подачи');
        // Реализуйте эту функцию
    });

    setupModalButton('save-match', function() {
        console.log('Сохранение матча');
        // Реализуйте эту функцию
    });

    setupModalButton('end-set-from-settings', function() {
        // Вручную вызываем логику завершения партии
        if (matchState.currentSet > matchState.maxSets) return;

        const setResult = {
            our: matchState.ourScore,
            opponent: matchState.opponentScore
        };

        fetch('/save_set', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                set_number: matchState.currentSet,
                result: setResult
            })
        })
        .then(response => {
            if (response.ok) {
                const setElement = document.getElementById(`set-${matchState.currentSet}`);
                if (setElement) {
                    setElement.textContent = `${matchState.currentSet} партия: ${matchState.ourScore}:${matchState.opponentScore}`;
                }

                matchState.ourScore = 0;
                matchState.opponentScore = 0;
                matchState.currentSet++;
                updateScoreDisplay();
            }
        })
        .catch(error => {
            console.error('Ошибка сохранения партии:', error);
        });
    });

    setupModalButton('end-game-from-settings', function() {
        // Логика завершения игры
        const setResult = {
            our: matchState.ourScore,
            opponent: matchState.opponentScore
        };

        fetch('/save_set', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                set_number: matchState.currentSet,
                result: setResult,
                end_match: true
            })
        })
        .then(() => {
            // Исправленная строка - перенаправляем на корневой URL
            window.location.href = "/";
        })
        .catch(error => {
            console.error('Ошибка завершения матча:', error);
        });
    });

    setupModalButton('clear-players', clearAllPlayers);
}

// Очистка всех игроков с поля
function clearAllPlayers() {
    document.querySelectorAll('.player-field.filled').forEach(field => {
        const playerNumber = field.textContent.match(/#(\d+)/)?.[1];
        if (playerNumber) {
            returnPlayerToBench(playerNumber);
            resetField(field);
        }
    });
}

// Функции для обработки долгого нажатия
function startLongPress(e) {
    longPressTimer = setTimeout(() => {
        showAttackOptionsModal(e.target);
    }, LONG_PRESS_DURATION);
}

function endLongPress() {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}

function cancelLongPress() {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}

// Обработчик обычного клика
function handleAttackPlusClick(e) {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;

        const zone = e.target.closest('[data-zone]');
        const playerNumber = zone.querySelector('.player-field.filled')?.textContent.match(/#(\d+)/)?.[1];
        if (playerNumber) {
            recordPlayerAction(playerNumber, 'Удар +', zone.dataset.zone);
        }
    }
}

// Показ модального окна с вариантами атак
function showAttackOptionsModal(button) {
    const modal = document.getElementById('attack-modal');
    if (!modal) return;

    const zone = button.closest('[data-zone]');
    const playerField = zone.querySelector('.player-field.filled');
    if (!playerField) return;

    const playerNumber = playerField.textContent.match(/#(\d+)/)?.[1];
    if (!playerNumber) return;

    // Позиционируем модальное окно рядом с кнопкой
    const rect = button.getBoundingClientRect();
    const modalContent = modal.querySelector('.attack-modal-content');
    modalContent.style.position = 'fixed';
    modalContent.style.left = `${rect.left}px`;
    modalContent.style.top = `${rect.bottom + 5}px`;

    // Закрытие модального окна
    const closeButton = modal.querySelector('.close');
    closeButton.onclick = function() {
        modal.style.display = 'none';
    };

    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Обработчики для кнопок вариантов атак
    document.getElementById('attack-cross').onclick = function() {
        recordPlayerAction(playerNumber, 'Удар + по диагонали', zone.dataset.zone);
        modal.style.display = 'none';
    };

    document.getElementById('attack-line').onclick = function() {
        recordPlayerAction(playerNumber, 'Удар + по линии', zone.dataset.zone);
        modal.style.display = 'none';
    };

    document.getElementById('attack-tip').onclick = function() {
        recordPlayerAction(playerNumber, 'Удар + скидка', zone.dataset.zone);
        modal.style.display = 'none';
    };

    document.getElementById('attack-block-out').onclick = function() {
        recordPlayerAction(playerNumber, 'Удар + в аут с блока', zone.dataset.zone);
        modal.style.display = 'none';
    };

    modal.style.display = 'block';
    longPressTimer = null;
}