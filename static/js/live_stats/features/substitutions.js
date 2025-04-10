/**
 * Модуль для управления заменой игроков
 * @module substitutions
 */

const Substitutions = {
    // Переменная для хранения текущего подсвеченного поля
    currentlyHighlightedField: null,

    /**
     * Инициализирует систему замен игроков
     */
    init: function() {
        // Находим все игровые зоны на площадке
        const playerFields = document.querySelectorAll('.player-field');

        // Добавляем обработчик клика для каждой зоны
        playerFields.forEach((field) => {
            field.addEventListener('click', (e) => this.handlePlayerFieldClick(e.currentTarget));
        });
    },

    /**
     * Обрабатывает клик по игровому полю
     * @param {HTMLElement} playerField - DOM-элемент игровой зоны
     */
    handlePlayerFieldClick: function(playerField) {
        // Убираем подсветку с предыдущего поля, если оно было
        if (this.currentlyHighlightedField) {
            this.currentlyHighlightedField.classList.remove('highlighted');
        }

        // Подсвечиваем текущее поле
        playerField.classList.add('highlighted');
        this.currentlyHighlightedField = playerField;

        // Открываем модальное окно для выбора замены
        this.openSubstitutionModal(playerField);
    },

    /**
     * Открывает модальное окно для замены игрока
     * @param {HTMLElement} playerField - DOM-элемент игровой зоны
     */
    openSubstitutionModal: function(playerField) {
        const modalWindow = document.getElementById('substitution-modal');
        const playersListContainer = document.getElementById('substitute-players');

        // Очищаем предыдущий список игроков
        playersListContainer.innerHTML = '';

        // Получаем номера игроков, которые уже на площадке
        const playersOnField = new Set();
        document.querySelectorAll('.player-field').forEach((field) => {
            const playerNumber = field.dataset.playerNumber;
            if (playerNumber) {
                playersOnField.add(playerNumber);
            }
        });

        // Проверяем, что данные игроков доступны
        if (!window.playersData) {
            console.error('Данные игроков не загружены!');
            return;
        }

        // Создаем кнопки для каждого запасного игрока
        window.playersData.forEach((player) => {
            // Пропускаем игроков, которые уже на поле
            if (playersOnField.has(player.number)) {
                return;
            }

            // Создаем кнопку для игрока
            const playerButton = document.createElement('button');
            playerButton.className = 'substitute-player-btn';
            playerButton.textContent = `${player.number} - ${player.last_name} ${player.first_name[0]}.`;

            // Добавляем обработчик выбора игрока
            playerButton.addEventListener('click', () => {
                this.performSubstitution(playerField, player);
                this.closeModalWindow();
            });

            // Добавляем кнопку в список
            playersListContainer.appendChild(playerButton);
        });

        // Показываем модальное окно
        modalWindow.style.display = 'block';
        document.body.classList.add('modal-open');

        // Добавляем небольшой таймаут для плавного появления
        setTimeout(() => {
            modalWindow.classList.add('show');
        }, 10);

        // Обработчик закрытия модального окна
        const closeButton = modalWindow.querySelector('.close');
        closeButton.addEventListener('click', () => this.closeModalWindow());
    },

    /**
     * Выполняет замену игрока в указанной зоне
     * @param {HTMLElement} playerField - DOM-элемент зоны
     * @param {Object} newPlayer - Данные нового игрока
     */
    performSubstitution: function(playerField, newPlayer) {
        const zoneNumber = playerField.dataset.zone;
        const previousPlayerNumber = playerField.dataset.playerNumber;

        // Обновляем отображение на странице
        playerField.dataset.playerNumber = newPlayer.number;
        playerField.textContent = `${newPlayer.number} - ${newPlayer.last_name} ${newPlayer.first_name[0]}.`;

        // Здесь можно добавить отправку данных на сервер
        console.log(`Произведена замена в зоне ${zoneNumber}:
            Игрок ${previousPlayerNumber || 'нет'} → ${newPlayer.number}`);

        // Убираем подсветку после замены
        playerField.classList.remove('highlighted');
        this.currentlyHighlightedField = null;
    },

    /**
     * Закрывает модальное окно замены
     */
    closeModalWindow: function() {
        const modalWindow = document.getElementById('substitution-modal');

        // Запускаем анимацию закрытия
        modalWindow.classList.remove('show');

        // После завершения анимации скрываем окно полностью
        setTimeout(() => {
            modalWindow.style.display = 'none';
            document.body.classList.remove('modal-open');

            // Убираем подсветку с поля
            if (this.currentlyHighlightedField) {
                this.currentlyHighlightedField.classList.remove('highlighted');
                this.currentlyHighlightedField = null;
            }
        }, 300);
    }
};

//// Экспортируем объект со всеми функциями
//export default Substitutions;
//
//// Инициализируем систему замен при загрузке модуля
//document.addEventListener('DOMContentLoaded', () => {
//    Substitutions.init();
//});